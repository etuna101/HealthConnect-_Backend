# 📊 Data Flow & Storage Explanation

## 🎯 Where Your Web App Data Goes

### 🔄 Complete Data Journey

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    ┌   Backend       │    ┌   MySQL         │
│   (User Input)  │───▶│   API Server    │───▶│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
   User types in form    API processes data    Data stored in tables
   (name, email, etc.)   (validation, etc.)    (users, doctors, etc.)
```

## 📱 What Happens When User Submits Data

### Example: User Registration

1. **User fills out registration form** on your website
2. **Frontend sends data** to: `http://localhost:5000/api/auth/register`
3. **Backend receives data** and validates it
4. **Backend saves to database** in the `users` table
5. **Backend sends response** back to frontend
6. **Frontend shows success message** to user

### Example: Payment Processing

1. **User enters payment details** (card number, etc.)
2. **Frontend sends payment data** to: `http://localhost:5000/api/payments/card`
3. **Backend processes payment** (simulated for now)
4. **Backend saves payment record** to `payments` table
5. **Backend sends confirmation** back to frontend
6. **Frontend shows payment success**

## 🗄️ Database Tables & What They Store

### Users Table
```sql
users table stores:
├── id (unique identifier)
├── first_name (user's first name)
├── last_name (user's last name)
├── email (user's email address)
├── phone (user's phone number)
├── date_of_birth (user's birth date)
├── password_hash (encrypted password)
├── role (patient, doctor, or admin)
├── status (active, inactive, suspended)
├── created_at (when account was created)
└── updated_at (when account was last updated)
```

### Consultations Table
```sql
consultations table stores:
├── id (unique identifier)
├── patient_id (which patient booked)
├── doctor_id (which doctor was booked)
├── appointment_date (when appointment is)
├── appointment_time (what time appointment is)
├── type (video, audio, or chat)
├── status (scheduled, confirmed, completed, cancelled)
├── symptoms (what patient reported)
├── diagnosis (doctor's diagnosis)
├── prescription (medications prescribed)
└── notes (additional notes)
```

### Payments Table
```sql
payments table stores:
├── id (unique identifier)
├── consultation_id (which consultation this payment is for)
├── amount (how much was paid)
├── currency (USD, KES, etc.)
├── payment_method (card, mpesa, intasend)
├── transaction_id (unique payment identifier)
├── status (pending, completed, failed, refunded)
└── payment_data (JSON with payment details)
```

## 🔍 How to See Your Stored Data

### 1. **View Database in MySQL**
```bash
# Connect to your database
mysql -u healthapp -p healthconnect

# View all users
SELECT * FROM users;

# View all consultations
SELECT * FROM consultations;

# View all payments
SELECT * FROM payments;
```

### 2. **View Data Through API**
```bash
# Get all users (requires admin token)
GET http://localhost:5000/api/users

# Get all consultations
GET http://localhost:5000/api/consultations

# Get payment history
GET http://localhost:5000/api/payments/history
```

### 3. **Check Database Files**
Your data is stored in MySQL data files on your computer:
- **Windows**: Usually in `C:\ProgramData\MySQL\MySQL Server 8.0\Data\`
- **macOS**: Usually in `/usr/local/mysql/data/`
- **Linux**: Usually in `/var/lib/mysql/`

## 🚨 Important: Data Security

### What's Protected
- ✅ **Passwords**: Encrypted with bcrypt (very secure)
- ✅ **API Access**: Protected with JWT tokens
- ✅ **Database**: Only accessible with correct credentials
- ✅ **Input Validation**: All data is validated before storage

### What You Need to Protect
- 🔒 **Database Password**: Keep your MySQL password secure
- 🔒 **JWT Secret**: Keep your JWT secret key secure
- 🔒 **Environment Variables**: Don't commit `.env` file to git

## 📊 Sample Data You'll See

After running `npm run init-db`, your database will contain:

### Sample Users
- **John Doe** (patient@example.com) - Test patient account
- **Dr. Sarah Johnson** - Family Medicine doctor
- **Dr. Michael Chen** - Cardiology doctor
- **Dr. Emily Rodriguez** - Dermatology doctor
- **Dr. James Wilson** - General Medicine doctor

### Sample Health Resources
- Health tips and articles
- Emergency information
- SDG 3 information

## 🔧 How to Access Your Data

### 1. **Start Your Backend**
```bash
cd doctor-dot-connect/BACKEND/backend
npm run dev
```

### 2. **Test API Endpoints**
```bash
# Health check
curl http://localhost:5000/health

# Get all doctors
curl http://localhost:5000/api/consultations/doctors

# Login with test account
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "patient@example.com", "password": "patient123"}'
```

### 3. **View Database Directly**
```bash
mysql -u healthapp -p healthconnect
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM doctors;
```

## 🎯 Summary

**Your web app data goes to:**
1. **MySQL Database** on your local machine
2. **Organized in tables** (users, doctors, consultations, payments, etc.)
3. **Accessible through** your backend API
4. **Secured with** encryption and authentication
5. **Stored permanently** until you delete it

**Think of it like this:**
- Your web app is like a **form collector**
- Your backend is like a **data processor**
- Your MySQL database is like a **filing cabinet**
- All your user data, payments, and medical records are safely stored and organized!

## 🚀 Next Steps

1. **Set up your database** using the setup instructions
2. **Run the initialization script** to create sample data
3. **Test your API endpoints** to see data flow
4. **Connect your frontend** to start collecting real data

Your HealthConnect app will then be a fully functional data collection and storage system! 🏥💻
