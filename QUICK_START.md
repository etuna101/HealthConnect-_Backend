# 🚀 HealthConnect Backend - Quick Start Guide

## Step-by-Step Setup to Get Your Web App Working

### Prerequisites
- Node.js installed (v18+)
- MySQL installed and running

### 1. Setup Environment File
```bash
# Navigate to backend directory
cd doctor-dot-connect/BACKEND/backend

# Create environment file
node setup-env.js

# Edit .env file with your database credentials
# Open .env in your editor and update:
# DB_PASSWORD=your_mysql_password
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start MySQL Service
```bash
# Windows (if using XAMPP)
# Start XAMPP and enable MySQL

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

### 4. Create Database and User
```bash
# Login to MySQL as root
mysql -u root -p

# Run these commands in MySQL:
CREATE DATABASE healthconnect;
CREATE USER 'healthapp'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON healthconnect.* TO 'healthapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Update Environment Variables
Edit your `.env` file:
```env
DB_HOST=localhost
DB_USER=healthapp
DB_PASSWORD=your_secure_password
DB_NAME=healthconnect
DB_PORT=3306
```

### 6. Initialize Database
```bash
npm run init-db
```
This will:
- Create all necessary tables
- Insert sample doctors
- Add health resources
- Create a test patient account

### 7. Start the Server
```bash
npm run dev
```

Your API will be running at: `http://localhost:5000`

### 8. Test the Setup
```bash
# Test health endpoint
curl http://localhost:5000/health

# Should return:
{
  "status": "OK",
  "message": "HealthConnect API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### 9. Test User Registration/Login
```bash
# Test login with sample patient
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "patient123"
  }'

# Should return a JWT token
```

## 💳 Payment Setup

### IntaSend Integration
1. Go to [IntaSend Dashboard](https://intasend.com/)
2. Create an account and get your API keys
3. Update your `.env` file:
```env
INTASEND_API_KEY=your_actual_api_key
INTASEND_PUBLISHABLE_KEY=your_actual_publishable_key
```

### M-Pesa Integration (Optional)
For real M-Pesa integration:
1. Get M-Pesa API credentials from Safaricom
2. Update your `.env` file:
```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
```

## 🧪 Testing Your API

### Available Test Data
- **Sample Patient**: patient@example.com / patient123
- **Sample Doctors**: 4 doctors with different specialties
- **Health Resources**: Educational content ready to use

### Key Endpoints to Test
```bash
# Get all doctors
GET http://localhost:5000/api/consultations/doctors

# Book a consultation (requires authentication)
POST http://localhost:5000/api/consultations/book

# Process payment
POST http://localhost:5000/api/payments/card
POST http://localhost:5000/api/payments/mpesa
POST http://localhost:5000/api/payments/intasend/initialize

# Get health resources
GET http://localhost:5000/api/health/resources
```

## 🔗 Connect Your Frontend

Your frontend can now make API calls to:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';

// Example: Login user
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'patient@example.com',
    password: 'patient123'
  })
});

const data = await response.json();
const token = data.token; // Use this for authenticated requests
```

## 📊 Database Structure
Your database now contains:
- `users` - Patient and doctor accounts
- `doctors` - Doctor profiles and specialties
- `consultations` - Appointment bookings
- `payments` - Payment transactions
- `health_records` - Patient health data
- `health_resources` - Educational content
- `messages` - Patient-doctor communication

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Error**:
   - Check MySQL is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **Permission Denied**:
   - Check MySQL user privileges
   - Verify user can access the database

3. **Port Already in Use**:
   - Change PORT in `.env` file
   - Kill process using port 5000

4. **Missing Dependencies**:
   - Run `npm install` again
   - Check Node.js version (v18+)

## 🎉 Success!

If everything is working:
- ✅ Database is connected and populated
- ✅ API endpoints are responding
- ✅ Sample data is available
- ✅ Payment system is ready
- ✅ Your web app can receive payments and store user data

Your HealthConnect application is now fully functional and ready for use! 🏥💻
