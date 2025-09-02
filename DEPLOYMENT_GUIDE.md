# HealthConnect Backend - Production Deployment Guide

## 🚀 Quick Start

Your HealthConnect backend is now fully equipped with all the necessary endpoints to support your frontend application. Here's how to get it running in production.

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration
Create a production `.env` file with the following required variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration (Use your production MySQL credentials)
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-secure-db-password
DB_NAME=healthconnect
DB_PORT=3306

# Security (CRITICAL: Use strong, unique values)
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.com

# Callback URLs
BACKEND_URL=https://your-backend-domain.com

# Payment Integration (Get from IntaSend dashboard)
INTASEND_API_KEY=your-production-intasend-api-key
INTASEND_PUBLISHABLE_KEY=your-production-intasend-publishable-key

# Email Configuration (Optional but recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-notification-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Database Setup

#### Option A: Cloud MySQL (Recommended)
1. **AWS RDS MySQL**
   - Create RDS MySQL instance
   - Configure security groups
   - Note connection details

2. **Google Cloud SQL**
   - Create Cloud SQL MySQL instance
   - Configure authorized networks
   - Enable SSL connections

3. **DigitalOcean Managed Database**
   - Create MySQL cluster
   - Add trusted sources
   - Get connection string

#### Option B: Self-Managed MySQL
```bash
# Install MySQL on your server
sudo apt update
sudo apt install mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
mysql -u root -p
CREATE DATABASE healthconnect;
CREATE USER 'healthapp'@'%' IDENTIFIED BY 'strong-password';
GRANT ALL PRIVILEGES ON healthconnect.* TO 'healthapp'@'%';
FLUSH PRIVILEGES;
```

## 🌐 Deployment Options

### Option 1: Railway (Recommended for beginners)

1. **Prepare your code:**
   ```bash
   git add .
   git commit -m "Production ready backend"
   git push origin main
   ```

2. **Deploy to Railway:**
   - Visit [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Add environment variables in Railway dashboard
   - Deploy automatically

3. **Add MySQL database:**
   - In Railway dashboard, add MySQL plugin
   - Copy database credentials to your environment

### Option 2: Heroku

1. **Install Heroku CLI:**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku app:**
   ```bash
   heroku create your-healthconnect-api
   ```

3. **Add MySQL database:**
   ```bash
   heroku addons:create jawsdb:kitefin
   ```

4. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret
   heroku config:set FRONTEND_URL=https://your-frontend.com
   # Add all other environment variables
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   ```

### Option 3: DigitalOcean App Platform

1. **Create app on DigitalOcean:**
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository
   - Configure build settings

2. **Environment Variables:**
   - Add all production environment variables
   - Configure database connection

3. **Database:**
   - Create DigitalOcean Managed MySQL database
   - Add connection details to environment

### Option 4: AWS EC2 + RDS

1. **Launch EC2 instance:**
   ```bash
   # On your EC2 instance
   sudo apt update
   sudo apt install nodejs npm nginx

   # Install PM2 for process management
   sudo npm install -g pm2

   # Clone your repository
   git clone your-repo-url
   cd backend
   npm install
   ```

2. **Set up MySQL on AWS RDS:**
   - Create RDS MySQL instance
   - Configure security groups
   - Add connection details to `.env`

3. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Start with PM2:**
   ```bash
   pm2 start server.js --name healthconnect-api
   pm2 startup
   pm2 save
   ```

## 🔧 Post-Deployment Setup

### 1. Initialize Database
After deployment, initialize your database:

```bash
# Via SSH or deployment shell
npm run init-db
```

This will:
- Create all required tables
- Insert sample doctors
- Add health resources
- Set up initial data

### 2. Test API Endpoints

```bash
# Health check
curl https://your-backend-url.com/health

# Expected response:
{
  "status": "OK",
  "message": "HealthConnect API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### 3. SSL/HTTPS Configuration

#### For most cloud platforms (automatic):
- Railway, Heroku, DigitalOcean provide HTTPS automatically

#### For self-managed servers:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## 🔒 Security Configuration

### 1. Production Security Checklist
- [ ] Strong JWT secret (256+ bit entropy)
- [ ] HTTPS enabled
- [ ] Database credentials secured
- [ ] Environment variables not committed to git
- [ ] CORS configured for your frontend domain only
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

### 2. Database Security
```sql
-- Create dedicated user with minimal privileges
CREATE USER 'healthapp'@'%' IDENTIFIED BY 'strong-random-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON healthconnect.* TO 'healthapp'@'%';
FLUSH PRIVILEGES;
```

### 3. Firewall Configuration
```bash
# Basic UFW setup for Ubuntu
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 📊 Monitoring & Maintenance

### 1. Health Monitoring
Set up monitoring for:
- API response times
- Database connection health
- Memory and CPU usage
- Error rates

### 2. Logging
```javascript
// Production logging setup (add to server.js)
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}
```

### 3. Database Backups
```bash
# Set up automated MySQL backups
mysqldump -h your-db-host -u username -p healthconnect > backup_$(date +%Y%m%d).sql
```

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run tests
      run: npm test
      
    - name: Deploy to Railway
      run: |
        npm install -g @railway/cli
        railway login --token ${{ secrets.RAILWAY_TOKEN }}
        railway up
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   ```bash
   # Check database credentials
   # Ensure database server is accessible
   # Verify firewall settings
   ```

2. **CORS Errors:**
   ```javascript
   // Verify FRONTEND_URL in environment
   // Check CORS configuration in server.js
   ```

3. **JWT Token Issues:**
   ```bash
   # Ensure JWT_SECRET is set
   # Check token expiration
   # Verify token format
   ```

4. **Payment Integration Issues:**
   ```bash
   # Verify IntaSend API keys
   # Check callback URL configuration
   # Test in IntaSend sandbox first
   ```

## 📞 Support Resources

### Getting Help
1. **API Documentation:** Check `/API_DOCUMENTATION.md`
2. **Server Logs:** Monitor application logs for errors
3. **Database Logs:** Check MySQL slow query log
4. **IntaSend Documentation:** [IntaSend Docs](https://developers.intasend.com/)

### Performance Optimization
1. **Database Indexing:** Ensure proper indexes on frequently queried columns
2. **Connection Pooling:** Already configured in `database.js`
3. **Caching:** Consider Redis for session storage
4. **CDN:** Use CDN for file uploads

## ✅ Production Readiness Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database initialized with sample data
- [ ] SSL/HTTPS enabled
- [ ] CORS configured correctly
- [ ] Payment integration tested
- [ ] Error monitoring set up
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security review done
- [ ] Documentation updated

## 🎉 Congratulations!

Your HealthConnect backend is now production-ready and fully integrated to support your frontend application! 

The API includes:
- ✅ Complete authentication system
- ✅ Consultation booking and management
- ✅ Multi-method payment processing
- ✅ Health records management
- ✅ Messaging system
- ✅ Health resources and tips
- ✅ Emergency information
- ✅ Dashboard statistics
- ✅ Comprehensive error handling

Your telemedicine platform is ready to make healthcare accessible and contribute to SDG 3: Good Health and Well-being! 🌍💙

