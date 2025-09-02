const fs = require('fs');
const path = require('path');

const envContent = `# HealthConnect Backend Environment Configuration

# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=healthapp
DB_PASSWORD=your_secure_password
DB_NAME=healthconnect
DB_PORT=3306

# JWT Configuration
JWT_SECRET=healthconnect-super-secret-jwt-key-change-in-production-2024

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Backend URL (for callbacks)
BACKEND_URL=http://localhost:5000

# IntaSend Configuration (Get from https://intasend.com/)
INTASEND_API_KEY=your_intasend_api_key_here
INTASEND_PUBLISHABLE_KEY=your_intasend_publishable_key_here

# M-Pesa Configuration (Optional - for real M-Pesa integration)
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_BUSINESS_SHORTCODE=your_business_shortcode
MPESA_PASSKEY=your_mpesa_passkey

# Email Configuration (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100`;

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('🔧 Please edit .env file with your database credentials');
} else {
  console.log('⚠️  .env file already exists');
}

