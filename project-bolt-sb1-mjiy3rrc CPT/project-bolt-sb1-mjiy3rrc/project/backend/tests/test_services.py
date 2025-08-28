"""
Unit tests for service layer
"""
import pytest
from datetime import datetime, timedelta
from app import app, db
from models import User, Transaction, Reward, Redemption
from services import UserService, TransactionService, RewardService, LoyaltyService

@pytest.fixture
def client():
    """Create test client"""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

@pytest.fixture
def sample_user():
    """Create sample user for testing"""
    user = User(
        name='Test User',
        email='test@example.com',
        balance=5000.0,
        points=100
    )
    db.session.add(user)
    db.session.commit()
    return user

@pytest.fixture
def sample_reward():
    """Create sample reward for testing"""
    reward = Reward(
        name='Test Reward',
        description='Test reward description',
        points_cost=50,
        category='Test',
        is_available=True
    )
    db.session.add(reward)
    db.session.commit()
    return reward

class TestUserService:
    """Test user service functionality"""
    
    def test_create_user(self, client):
        """Test user creation"""
        user = UserService.create_user(
            name='John Doe',
            email='john@example.com',
            phone='+27123456789'
        )
        
        assert user.name == 'John Doe'
        assert user.email == 'john@example.com'
        assert user.phone == '+27123456789'
        assert user.balance == 5000.0
        assert user.points == 0
        assert user.tier == 'Bronze'
    
    def test_get_user_dashboard_data(self, client, sample_user):
        """Test dashboard data retrieval"""
        # Create some transactions
        transaction = Transaction(
            user_id=sample_user.id,
            transaction_type='send',
            amount=500,
            points_earned=5,
            recipient='Test Recipient',
            status='completed'
        )
        db.session.add(transaction)
        db.session.commit()
        
        dashboard_data = UserService.get_user_dashboard_data(sample_user.id)
        
        assert dashboard_data is not None
        assert dashboard_data['user']['id'] == sample_user.id
        assert len(dashboard_data['recent_transactions']) == 1
        assert dashboard_data['monthly_points'] >= 0

class TestTransactionService:
    """Test transaction service functionality"""
    
    def test_send_money_success(self, client, sample_user):
        """Test successful money transfer"""
        initial_balance = sample_user.balance
        initial_points = sample_user.points
        
        success, message, transaction = TransactionService.send_money(
            user_id=sample_user.id,
            amount=500,
            recipient='Test Recipient',
            recipient_phone='+27123456789'
        )
        
        assert success is True
        assert transaction is not None
        assert transaction.amount == 500
        assert transaction.points_earned == 5  # 500/100 = 5 points
        
        # Refresh user from database
        db.session.refresh(sample_user)
        assert sample_user.balance == initial_balance - 500
        assert sample_user.points == initial_points + 5
        assert sample_user.total_sent == 500
    
    def test_send_money_insufficient_balance(self, client, sample_user):
        """Test money transfer with insufficient balance"""
        success, message, transaction = TransactionService.send_money(
            user_id=sample_user.id,
            amount=10000,  # More than balance
            recipient='Test Recipient'
        )
        
        assert success is False
        assert 'Insufficient balance' in message
        assert transaction is None
    
    def test_send_money_invalid_recipient(self, client, sample_user):
        """Test money transfer with invalid recipient"""
        success, message, transaction = TransactionService.send_money(
            user_id=sample_user.id,
            amount=500,
            recipient=''  # Empty recipient
        )
        
        assert success is False
        assert 'required' in message.lower()
        assert transaction is None
    
    def test_tier_upgrade(self, client, sample_user):
        """Test tier upgrade after large transaction"""
        # Set user close to Silver tier
        sample_user.total_sent = 19500
        db.session.commit()
        
        success, message, transaction = TransactionService.send_money(
            user_id=sample_user.id,
            amount=1000,  # This should push to Silver
            recipient='Test Recipient'
        )
        
        assert success is True
        db.session.refresh(sample_user)
        assert sample_user.tier == 'Silver'
        assert sample_user.total_sent == 20500

class TestRewardService:
    """Test reward service functionality"""
    
    def test_get_available_rewards(self, client, sample_reward):
        """Test getting available rewards"""
        rewards = RewardService.get_available_rewards()
        
        assert len(rewards) == 1
        assert rewards[0]['name'] == 'Test Reward'
        assert rewards[0]['pointsCost'] == 50
    
    def test_get_rewards_by_category(self, client, sample_reward):
        """Test filtering rewards by category"""
        rewards = RewardService.get_available_rewards(category='Test')
        assert len(rewards) == 1
        
        rewards = RewardService.get_available_rewards(category='NonExistent')
        assert len(rewards) == 0
    
    def test_redeem_reward_success(self, client, sample_user, sample_reward):
        """Test successful reward redemption"""
        initial_points = sample_user.points
        
        success, message, redemption = RewardService.redeem_reward(
            user_id=sample_user.id,
            reward_id=sample_reward.id
        )
        
        assert success is True
        assert redemption is not None
        assert redemption.points_spent == sample_reward.points_cost
        
        # Check user points were deducted
        db.session.refresh(sample_user)
        assert sample_user.points == initial_points - sample_reward.points_cost
    
    def test_redeem_reward_insufficient_points(self, client, sample_user, sample_reward):
        """Test reward redemption with insufficient points"""
        # Set user points below reward cost
        sample_user.points = 10
        db.session.commit()
        
        success, message, redemption = RewardService.redeem_reward(
            user_id=sample_user.id,
            reward_id=sample_reward.id
        )
        
        assert success is False
        assert 'Insufficient points' in message
        assert redemption is None
    
    def test_redeem_unavailable_reward(self, client, sample_user, sample_reward):
        """Test redemption of unavailable reward"""
        sample_reward.is_available = False
        db.session.commit()
        
        success, message, redemption = RewardService.redeem_reward(
            user_id=sample_user.id,
            reward_id=sample_reward.id
        )
        
        assert success is False
        assert 'not available' in message.lower()
        assert redemption is None

class TestLoyaltyService:
    """Test loyalty service functionality"""
    
    def test_calculate_tier_benefits(self, client):
        """Test tier benefits calculation"""
        bronze_benefits = LoyaltyService.calculate_tier_benefits('Bronze')
        silver_benefits = LoyaltyService.calculate_tier_benefits('Silver')
        gold_benefits = LoyaltyService.calculate_tier_benefits('Gold')
        
        assert bronze_benefits['point_multiplier'] == 1.0
        assert silver_benefits['point_multiplier'] == 1.2
        assert gold_benefits['point_multiplier'] == 1.5
        
        assert not bronze_benefits['special_offers']
        assert silver_benefits['special_offers']
        assert gold_benefits['special_offers']
    
    def test_award_bonus_points(self, client, sample_user):
        """Test awarding bonus points"""
        initial_points = sample_user.points
        bonus_points = 50
        
        transaction = LoyaltyService.award_bonus_points(
            user_id=sample_user.id,
            points=bonus_points,
            reason='Test bonus'
        )
        
        assert transaction is not None
        assert transaction.points_earned == bonus_points
        assert transaction.transaction_type == 'bonus'
        
        db.session.refresh(sample_user)
        assert sample_user.points == initial_points + bonus_points
    
    def test_get_leaderboard(self, client):
        """Test leaderboard generation"""
        # Create multiple users with different points
        users = []
        for i in range(5):
            user = User(
                name=f'User {i}',
                email=f'user{i}@example.com',
                points=100 * (i + 1)  # 100, 200, 300, 400, 500 points
            )
            users.append(user)
            db.session.add(user)
        db.session.commit()
        
        leaderboard = LoyaltyService.get_leaderboard(limit=3)
        
        assert len(leaderboard) == 3
        assert leaderboard[0]['points'] == 500  # Highest points first
        assert leaderboard[0]['rank'] == 1
        assert leaderboard[1]['points'] == 400
        assert leaderboard[2]['points'] == 300

if __name__ == '__main__':
    pytest.main([__file__])