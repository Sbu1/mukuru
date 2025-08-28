"""
Database models for Mukuru Loyalty Program
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    """User model for customer accounts"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(128))
    balance = db.Column(db.Float, default=5000.0)
    points = db.Column(db.Integer, default=0)
    total_sent = db.Column(db.Float, default=0.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')
    redemptions = db.relationship('Redemption', backref='user', lazy=True, cascade='all, delete-orphan')
    
    @property
    def tier(self):
        """Calculate user tier based on total amount sent"""
        if self.total_sent >= 50000:
            return 'Gold'
        elif self.total_sent >= 20000:
            return 'Silver'
        return 'Bronze'
    
    @property
    def tier_progress(self):
        """Calculate progress to next tier"""
        if self.tier == 'Gold':
            return 100
        
        next_threshold = 20000 if self.tier == 'Bronze' else 50000
        return min((self.total_sent / next_threshold) * 100, 100)
    
    def can_send(self, amount):
        """Check if user can send specified amount"""
        return self.balance >= amount and amount > 0
    
    def calculate_points(self, amount):
        """Calculate points for transaction amount"""
        return int(amount // 100)  # 1 point per R100
    
    def to_dict(self):
        """Convert user to dictionary for JSON response"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'balance': self.balance,
            'points': self.points,
            'total_sent': self.total_sent,
            'tier': self.tier,
            'tier_progress': self.tier_progress,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Transaction(db.Model):
    """Transaction model for money transfers and point activities"""
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # 'send', 'reward', 'bonus'
    amount = db.Column(db.Float, nullable=False)
    points_earned = db.Column(db.Integer, default=0)
    recipient = db.Column(db.String(100))
    recipient_phone = db.Column(db.String(20))
    reference = db.Column(db.String(50), unique=True)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'completed', 'failed'
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    def __init__(self, **kwargs):
        super(Transaction, self).__init__(**kwargs)
        if not self.reference:
            self.reference = self.generate_reference()
    
    def generate_reference(self):
        """Generate unique transaction reference"""
        import uuid
        return f"MUK{uuid.uuid4().hex[:8].upper()}"
    
    def complete_transaction(self):
        """Mark transaction as completed"""
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert transaction to dictionary for JSON response"""
        return {
            'id': self.id,
            'type': self.transaction_type,
            'amount': self.amount,
            'points': self.points_earned,
            'recipient': self.recipient,
            'recipient_phone': self.recipient_phone,
            'reference': self.reference,
            'status': self.status,
            'description': self.description,
            'date': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class Reward(db.Model):
    """Reward model for loyalty program rewards"""
    __tablename__ = 'rewards'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    points_cost = db.Column(db.Integer, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    image_url = db.Column(db.String(200))
    is_available = db.Column(db.Boolean, default=True)
    stock_quantity = db.Column(db.Integer, default=-1)  # -1 for unlimited
    terms_conditions = db.Column(db.Text)
    expiry_days = db.Column(db.Integer, default=30)  # Days until reward expires
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    redemptions = db.relationship('Redemption', backref='reward', lazy=True)
    
    @property
    def is_in_stock(self):
        """Check if reward is in stock"""
        if self.stock_quantity == -1:  # Unlimited stock
            return True
        return self.stock_quantity > 0
    
    @property
    def redemption_count(self):
        """Get total number of redemptions"""
        return len(self.redemptions)
    
    def can_redeem(self, user):
        """Check if user can redeem this reward"""
        return (self.is_available and 
                self.is_in_stock and 
                user.points >= self.points_cost)
    
    def to_dict(self):
        """Convert reward to dictionary for JSON response"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'pointsCost': self.points_cost,
            'category': self.category,
            'image': self.image_url,
            'available': self.is_available,
            'inStock': self.is_in_stock,
            'stockQuantity': self.stock_quantity,
            'termsConditions': self.terms_conditions,
            'expiryDays': self.expiry_days,
            'redemptionCount': self.redemption_count,
            'created_at': self.created_at.isoformat()
        }

class Redemption(db.Model):
    """Redemption model for tracking reward redemptions"""
    __tablename__ = 'redemptions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=False)
    points_spent = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'completed', 'expired', 'cancelled'
    redemption_code = db.Column(db.String(20), unique=True)
    expires_at = db.Column(db.DateTime)
    redeemed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, **kwargs):
        super(Redemption, self).__init__(**kwargs)
        if not self.redemption_code:
            self.redemption_code = self.generate_redemption_code()
        if not self.expires_at and hasattr(self, 'reward') and self.reward:
            from datetime import timedelta
            self.expires_at = datetime.utcnow() + timedelta(days=self.reward.expiry_days)
    
    def generate_redemption_code(self):
        """Generate unique redemption code"""
        import random
        import string
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    @property
    def is_expired(self):
        """Check if redemption has expired"""
        return datetime.utcnow() > self.expires_at if self.expires_at else False
    
    def complete_redemption(self):
        """Mark redemption as completed"""
        self.status = 'completed'
        self.redeemed_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert redemption to dictionary for JSON response"""
        return {
            'id': self.id,
            'reward_id': self.reward_id,
            'points_spent': self.points_spent,
            'status': self.status,
            'redemption_code': self.redemption_code,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'redeemed_at': self.redeemed_at.isoformat() if self.redeemed_at else None,
            'created_at': self.created_at.isoformat(),
            'is_expired': self.is_expired
        }

class UserTierHistory(db.Model):
    """Track user tier progression history"""
    __tablename__ = 'user_tier_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    old_tier = db.Column(db.String(20))
    new_tier = db.Column(db.String(20), nullable=False)
    total_sent_at_change = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='tier_history')
    
    def to_dict(self):
        return {
            'id': self.id,
            'old_tier': self.old_tier,
            'new_tier': self.new_tier,
            'total_sent_at_change': self.total_sent_at_change,
            'created_at': self.created_at.isoformat()
        }