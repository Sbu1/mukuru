# Mukuru Loyalty Program - Python Backend

This is the Python Flask backend for the Mukuru Loyalty Rewards Program. It provides a complete REST API for managing users, transactions, points, and rewards.

## Features

- **User Management**: Registration, authentication, profile management
- **Transaction Processing**: Money transfers with automatic point calculation
- **Loyalty Points System**: Earn 1 point per R100 sent
- **Tier System**: Bronze, Silver, Gold tiers based on total amount sent
- **Rewards Marketplace**: Browse and redeem rewards using points
- **Transaction History**: Complete audit trail of all activities
- **RESTful API**: Clean, documented endpoints for frontend integration

## Tech Stack

- **Framework**: Flask 2.3.3
- **Database**: SQLAlchemy with SQLite (easily configurable for PostgreSQL/MySQL)
- **Authentication**: Flask-JWT-Extended for secure token-based auth
- **Background Tasks**: Celery with Redis for async processing
- **API Documentation**: Built-in Swagger/OpenAPI support
- **Testing**: pytest with comprehensive test coverage

## Installation & Setup

### Prerequisites
- Python 3.8+
- pip
- Redis (for background tasks)

### Installation Steps

1. **Clone and setup virtual environment**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Environment Configuration**:
```bash
# Create .env file
cp .env.example .env

# Edit .env with your settings
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///mukuru_loyalty.db
REDIS_URL=redis://localhost:6379/0
```

4. **Initialize Database**:
```bash
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

5. **Run the application**:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token

### User Management
- `GET /api/user/profile` - Get user profile with transactions
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/dashboard` - Get dashboard data

### Transactions
- `POST /api/send-money` - Send money and earn points
- `GET /api/transactions` - Get transaction history (paginated)
- `GET /api/transactions/{id}` - Get specific transaction

### Rewards
- `GET /api/rewards` - Get available rewards
- `GET /api/rewards/categories` - Get reward categories
- `POST /api/redeem-reward` - Redeem reward with points
- `GET /api/user/redemptions` - Get user's redemption history

### Loyalty Program
- `GET /api/loyalty/leaderboard` - Get points leaderboard
- `POST /api/loyalty/bonus-points` - Award bonus points (admin)
- `GET /api/loyalty/tiers` - Get tier information

## Database Schema

### Users Table
- User account information
- Balance, points, total sent tracking
- Tier calculation based on spending

### Transactions Table
- All money transfers and point activities
- Complete audit trail with references
- Status tracking (pending, completed, failed)

### Rewards Table
- Available rewards with categories
- Point costs and stock management
- Terms and conditions

### Redemptions Table
- User reward redemptions
- Redemption codes and expiry dates
- Status tracking

## Business Logic

### Points Calculation
```python
def calculate_points(amount):
    return int(amount // 100)  # 1 point per R100
```

### Tier System
```python
def calculate_tier(total_sent):
    if total_sent >= 50000:
        return 'Gold'
    elif total_sent >= 20000:
        return 'Silver'
    return 'Bronze'
```

### Transaction Processing
1. Validate user balance and transaction details
2. Calculate points earned
3. Update user balance and points
4. Check for tier upgrades
5. Create transaction record
6. Send confirmation (email/SMS)

## Testing

Run the test suite:
```bash
pytest tests/ -v
```

Test coverage:
```bash
pytest --cov=app tests/
```

## Deployment

### Production Setup
1. Use PostgreSQL instead of SQLite
2. Configure Redis for session storage and caching
3. Set up Celery workers for background tasks
4. Use Gunicorn as WSGI server
5. Configure nginx as reverse proxy
6. Set up SSL certificates

### Docker Deployment
```bash
docker build -t mukuru-loyalty-backend .
docker run -p 5000:5000 mukuru-loyalty-backend
```

## API Integration

The frontend React app connects to this backend via REST API calls:

```javascript
// Example: Send money
const response = await fetch('/api/send-money', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 500,
    recipient: 'John Doe',
    recipient_phone: '+27123456789'
  })
});
```

## Security Features

- JWT token-based authentication
- Password hashing with Werkzeug
- CORS configuration for frontend integration
- Input validation and sanitization
- SQL injection prevention via SQLAlchemy ORM
- Rate limiting on sensitive endpoints

## Monitoring & Analytics

- Transaction volume and success rates
- User engagement metrics
- Points earning and redemption patterns
- Tier progression analytics
- Popular rewards tracking

## Future Enhancements

- SMS/Email notifications
- Advanced fraud detection
- Machine learning for personalized rewards
- Integration with external payment providers
- Mobile app API support
- Advanced reporting dashboard