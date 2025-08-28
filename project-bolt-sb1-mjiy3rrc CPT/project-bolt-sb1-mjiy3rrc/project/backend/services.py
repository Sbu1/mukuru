"""
Business logic services for Mukuru Loyalty Program
"""
from datetime import datetime, timedelta
from models import db, User, Transaction, Reward, Redemption, UserTierHistory
from typing import Dict, List, Optional, Tuple

class UserService:
    """Service class for user-related operations"""
    
    @staticmethod
    def create_user(name: str, email: str, phone: str = None, initial_balance: float = 5000.0) -> User:
        """Create a new user account"""
        user = User(
            name=name,
            email=email,
            phone=phone,
            balance=initial_balance
        )
        db.session.add(user)
        db.session.commit()
        return user
    
    @staticmethod
    def get_user_dashboard_data(user_id: int) -> Dict:
        """Get comprehensive dashboard data for user"""
        user = User.query.get(user_id)
        if not user:
            return None
        
        # Get recent transactions
        recent_transactions = Transaction.query.filter_by(user_id=user_id)\
                                             .order_by(Transaction.created_at.desc())\
                                             .limit(5).all()
        
        # Get monthly points
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_points = db.session.query(db.func.sum(Transaction.points_earned))\
                                  .filter(Transaction.user_id == user_id,
                                         Transaction.created_at >= current_month,
                                         Transaction.points_earned > 0)\
                                  .scalar() or 0
        
        # Get total earned points
        total_earned = db.session.query(db.func.sum(Transaction.points_earned))\
                                .filter(Transaction.user_id == user_id,
                                       Transaction.points_earned > 0)\
                                .scalar() or 0
        
        return {
            'user': user.to_dict(),
            'recent_transactions': [t.to_dict() for t in recent_transactions],
            'monthly_points': monthly_points,
            'total_earned': total_earned,
            'tier_progress': user.tier_progress
        }

class TransactionService:
    """Service class for transaction-related operations"""
    
    @staticmethod
    def send_money(user_id: int, amount: float, recipient: str, recipient_phone: str = None) -> Tuple[bool, str, Optional[Transaction]]:
        """Process money transfer and award points"""
        user = User.query.get(user_id)
        if not user:
            return False, "User not found", None
        
        # Validate transaction
        if not user.can_send(amount):
            return False, "Insufficient balance or invalid amount", None
        
        if not recipient:
            return False, "Recipient name is required", None
        
        # Calculate points
        points_earned = user.calculate_points(amount)
        old_tier = user.tier
        
        # Create transaction
        transaction = Transaction(
            user_id=user_id,
            transaction_type='send',
            amount=amount,
            points_earned=points_earned,
            recipient=recipient,
            recipient_phone=recipient_phone,
            status='completed',
            description=f"Money sent to {recipient}"
        )
        
        # Update user
        user.balance -= amount
        user.points += points_earned
        user.total_sent += amount
        
        # Check for tier upgrade
        new_tier = user.tier
        if old_tier != new_tier:
            tier_history = UserTierHistory(
                user_id=user_id,
                old_tier=old_tier,
                new_tier=new_tier,
                total_sent_at_change=user.total_sent
            )
            db.session.add(tier_history)
        
        transaction.complete_transaction()
        db.session.add(transaction)
        db.session.commit()
        
        return True, "Transaction completed successfully", transaction
    
    @staticmethod
    def get_user_transactions(user_id: int, page: int = 1, per_page: int = 20, transaction_type: str = None) -> Dict:
        """Get paginated user transactions"""
        query = Transaction.query.filter_by(user_id=user_id)
        
        if transaction_type:
            query = query.filter_by(transaction_type=transaction_type)
        
        transactions = query.order_by(Transaction.created_at.desc())\
                           .paginate(page=page, per_page=per_page, error_out=False)
        
        return {
            'transactions': [t.to_dict() for t in transactions.items],
            'total': transactions.total,
            'pages': transactions.pages,
            'current_page': page,
            'has_next': transactions.has_next,
            'has_prev': transactions.has_prev
        }

class RewardService:
    """Service class for reward-related operations"""
    
    @staticmethod
    def get_available_rewards(category: str = None) -> List[Dict]:
        """Get all available rewards, optionally filtered by category"""
        query = Reward.query.filter_by(is_available=True)
        
        if category and category != 'All':
            query = query.filter_by(category=category)
        
        rewards = query.order_by(Reward.points_cost.asc()).all()
        return [reward.to_dict() for reward in rewards]
    
    @staticmethod
    def get_reward_categories() -> List[str]:
        """Get all unique reward categories"""
        categories = db.session.query(Reward.category.distinct())\
                              .filter_by(is_available=True)\
                              .all()
        return [cat[0] for cat in categories]
    
    @staticmethod
    def redeem_reward(user_id: int, reward_id: int) -> Tuple[bool, str, Optional[Redemption]]:
        """Redeem a reward using user points"""
        user = User.query.get(user_id)
        reward = Reward.query.get(reward_id)
        
        if not user:
            return False, "User not found", None
        
        if not reward:
            return False, "Reward not found", None
        
        if not reward.can_redeem(user):
            if not reward.is_available:
                return False, "Reward is not available", None
            elif not reward.is_in_stock:
                return False, "Reward is out of stock", None
            else:
                return False, "Insufficient points", None
        
        # Create redemption
        redemption = Redemption(
            user_id=user_id,
            reward_id=reward_id,
            points_spent=reward.points_cost,
            status='completed'
        )
        
        # Create transaction for points deduction
        transaction = Transaction(
            user_id=user_id,
            transaction_type='reward',
            amount=0,
            points_earned=-reward.points_cost,
            status='completed',
            description=f"Redeemed {reward.name}"
        )
        
        # Update user points
        user.points -= reward.points_cost
        
        # Update stock if limited
        if reward.stock_quantity > 0:
            reward.stock_quantity -= 1
        
        redemption.complete_redemption()
        transaction.complete_transaction()
        
        db.session.add(redemption)
        db.session.add(transaction)
        db.session.commit()
        
        return True, "Reward redeemed successfully", redemption
    
    @staticmethod
    def get_user_redemptions(user_id: int) -> List[Dict]:
        """Get all user redemptions with reward details"""
        redemptions = db.session.query(Redemption, Reward)\
                               .join(Reward)\
                               .filter(Redemption.user_id == user_id)\
                               .order_by(Redemption.created_at.desc())\
                               .all()
        
        result = []
        for redemption, reward in redemptions:
            redemption_dict = redemption.to_dict()
            redemption_dict['reward'] = reward.to_dict()
            result.append(redemption_dict)
        
        return result

class LoyaltyService:
    """Service class for loyalty program operations"""
    
    @staticmethod
    def calculate_tier_benefits(tier: str) -> Dict:
        """Get tier-specific benefits"""
        benefits = {
            'Bronze': {
                'point_multiplier': 1.0,
                'bonus_rewards': [],
                'special_offers': False,
                'priority_support': False
            },
            'Silver': {
                'point_multiplier': 1.2,
                'bonus_rewards': ['Monthly bonus points'],
                'special_offers': True,
                'priority_support': False
            },
            'Gold': {
                'point_multiplier': 1.5,
                'bonus_rewards': ['Monthly bonus points', 'Exclusive rewards'],
                'special_offers': True,
                'priority_support': True
            }
        }
        return benefits.get(tier, benefits['Bronze'])
    
    @staticmethod
    def award_bonus_points(user_id: int, points: int, reason: str) -> Transaction:
        """Award bonus points to user"""
        user = User.query.get(user_id)
        if not user:
            return None
        
        transaction = Transaction(
            user_id=user_id,
            transaction_type='bonus',
            amount=0,
            points_earned=points,
            status='completed',
            description=reason
        )
        
        user.points += points
        transaction.complete_transaction()
        
        db.session.add(transaction)
        db.session.commit()
        
        return transaction
    
    @staticmethod
    def get_leaderboard(limit: int = 10) -> List[Dict]:
        """Get top users by points for leaderboard"""
        users = User.query.filter_by(is_active=True)\
                         .order_by(User.points.desc())\
                         .limit(limit)\
                         .all()
        
        leaderboard = []
        for i, user in enumerate(users, 1):
            leaderboard.append({
                'rank': i,
                'name': user.name,
                'points': user.points,
                'tier': user.tier
            })
        
        return leaderboard