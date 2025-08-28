from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mukuru_loyalty.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    balance = db.Column(db.Float, default=5000.0)
    points = db.Column(db.Integer, default=0)
    total_sent = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='user', lazy=True)
    redemptions = db.relationship('Redemption', backref='user', lazy=True)
    
    @property
    def tier(self):
        """Calculate user tier based on total amount sent"""
        if self.total_sent >= 50000:
            return 'Gold'
        elif self.total_sent >= 20000:
            return 'Silver'
        return 'Bronze'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'balance': self.balance,
            'points': self.points,
            'total_sent': self.total_sent,
            'tier': self.tier,
            'created_at': self.created_at.isoformat()
        }

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # 'send' or 'reward'
    amount = db.Column(db.Float, nullable=False)
    points_earned = db.Column(db.Integer, default=0)
    recipient = db.Column(db.String(100))
    status = db.Column(db.String(20), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': self.transaction_type,
            'amount': self.amount,
            'points': self.points_earned,
            'recipient': self.recipient,
            'status': self.status,
            'date': self.created_at.isoformat()
        }

class Reward(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    points_cost = db.Column(db.Integer, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    image_url = db.Column(db.String(200))
    is_available = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'pointsCost': self.points_cost,
            'category': self.category,
            'image': self.image_url,
            'available': self.is_available
        }

class Redemption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reward_id = db.Column(db.Integer, db.ForeignKey('reward.id'), nullable=False)
    points_spent = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    reward = db.relationship('Reward', backref='redemptions')

# API Routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    """User authentication endpoint"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    
    if user and check_password_hash(user.password_hash, password):
        session['user_id'] = user.id
        return jsonify({
            'success': True,
            'user': user.to_dict()
        })
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """Get current user profile with transactions"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get recent transactions
    transactions = Transaction.query.filter_by(user_id=user.id)\
                                  .order_by(Transaction.created_at.desc())\
                                  .limit(10).all()
    
    # Get redeemed rewards
    redemptions = Redemption.query.filter_by(user_id=user.id).all()
    redeemed_reward_ids = [r.reward_id for r in redemptions]
    
    return jsonify({
        'user': user.to_dict(),
        'transactions': [t.to_dict() for t in transactions],
        'rewardsPurchased': redeemed_reward_ids
    })

@app.route('/api/send-money', methods=['POST'])
def send_money():
    """Process money transfer and award points"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    amount = float(data.get('amount', 0))
    recipient = data.get('recipient', '')
    
    user = User.query.get(session['user_id'])
    
    # Validate transaction
    if amount <= 0:
        return jsonify({'error': 'Invalid amount'}), 400
    
    if amount > user.balance:
        return jsonify({'error': 'Insufficient balance'}), 400
    
    if not recipient:
        return jsonify({'error': 'Recipient required'}), 400
    
    # Calculate points (1 point per R100)
    points_earned = int(amount // 100)
    
    # Update user balance and points
    user.balance -= amount
    user.points += points_earned
    user.total_sent += amount
    
    # Create transaction record
    transaction = Transaction(
        user_id=user.id,
        transaction_type='send',
        amount=amount,
        points_earned=points_earned,
        recipient=recipient,
        status='completed'
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'transaction': transaction.to_dict(),
        'user': user.to_dict(),
        'points_earned': points_earned
    })

@app.route('/api/rewards', methods=['GET'])
def get_rewards():
    """Get all available rewards"""
    rewards = Reward.query.filter_by(is_available=True).all()
    return jsonify([reward.to_dict() for reward in rewards])

@app.route('/api/redeem-reward', methods=['POST'])
def redeem_reward():
    """Redeem a reward using points"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    reward_id = data.get('reward_id')
    
    user = User.query.get(session['user_id'])
    reward = Reward.query.get(reward_id)
    
    if not reward or not reward.is_available:
        return jsonify({'error': 'Reward not available'}), 404
    
    if user.points < reward.points_cost:
        return jsonify({'error': 'Insufficient points'}), 400
    
    # Process redemption
    user.points -= reward.points_cost
    
    # Create redemption record
    redemption = Redemption(
        user_id=user.id,
        reward_id=reward.id,
        points_spent=reward.points_cost
    )
    
    # Create transaction record for points deduction
    transaction = Transaction(
        user_id=user.id,
        transaction_type='reward',
        amount=0,
        points_earned=-reward.points_cost,
        status='completed'
    )
    
    db.session.add(redemption)
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'user': user.to_dict(),
        'reward': reward.to_dict()
    })

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get user transaction history"""
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    transactions = Transaction.query.filter_by(user_id=session['user_id'])\
                                  .order_by(Transaction.created_at.desc())\
                                  .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'transactions': [t.to_dict() for t in transactions.items],
        'total': transactions.total,
        'pages': transactions.pages,
        'current_page': page
    })

# Initialize database and seed data
def init_db():
    """Initialize database with sample data"""
    db.create_all()
    
    # Create sample rewards if they don't exist
    if Reward.query.count() == 0:
        sample_rewards = [
            Reward(
                name='R50 Airtime',
                description='Mobile airtime voucher for any network',
                points_cost=50,
                category='Airtime',
                image_url='https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=400'
            ),
            Reward(
                name='R100 Grocery Voucher',
                description='Redeemable at major grocery stores',
                points_cost=100,
                category='Shopping',
                image_url='https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400'
            ),
            Reward(
                name='R200 Fuel Voucher',
                description='Fuel voucher for major petrol stations',
                points_cost=200,
                category='Transport',
                image_url='https://images.pexels.com/photos/33688/delicate-arch-night-stars-landscape.jpg?auto=compress&cs=tinysrgb&w=400'
            ),
            Reward(
                name='Movie Tickets (2x)',
                description='Two movie tickets for any cinema',
                points_cost=150,
                category='Entertainment',
                image_url='https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
            ),
            Reward(
                name='R300 Restaurant Voucher',
                description='Fine dining experience voucher',
                points_cost=300,
                category='Dining',
                image_url='https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=400'
            ),
            Reward(
                name='Bluetooth Headphones',
                description='Premium wireless headphones',
                points_cost=500,
                category='Electronics',
                image_url='https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=400'
            )
        ]
        
        for reward in sample_rewards:
            db.session.add(reward)
        
        db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True, port=5000)