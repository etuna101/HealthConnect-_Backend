# 🔧 Database Initialization Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. **MySQL Not Running**

**Problem**: `ECONNREFUSED` or `Connection refused` error

**Solutions**:
```bash
# Windows (XAMPP)
# Start XAMPP Control Panel and enable MySQL

# Windows (MySQL Service)
net start mysql80

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
sudo systemctl status mysql
```

### 2. **Wrong Database Credentials**

**Problem**: `Access denied for user` error

**Check your `.env` file**:
```env
DB_HOST=localhost
DB_USER=healthapp
DB_PASSWORD=your_actual_password
DB_NAME=healthconnect
DB_PORT=3306
```

**Fix**:
```bash
# Test connection manually
mysql -u healthapp -p healthconnect

# If this fails, recreate the user:
mysql -u root -p
CREATE USER 'healthapp'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON healthconnect.* TO 'healthapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. **Database Doesn't Exist**

**Problem**: `Unknown database 'healthconnect'` error

**Solution**:
```bash
mysql -u root -p
CREATE DATABASE healthconnect;
EXIT;
```

### 4. **Port Already in Use**

**Problem**: `EADDRINUSE` error

**Solutions**:
```bash
# Find what's using port 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # macOS/Linux

# Kill the process or change port in .env
PORT=5001  # Change to different port
```

### 5. **Missing Dependencies**

**Problem**: `Cannot find module` errors

**Solution**:
```bash
cd doctor-dot-connect/BACKEND/backend
npm install
```

### 6. **Node.js Version Issues**

**Problem**: Various compatibility errors

**Check version**:
```bash
node --version  # Should be v18 or higher
npm --version
```

**Update if needed**:
```bash
# Using nvm (recommended)
nvm install 18
nvm use 18
```

### 7. **Permission Issues**

**Problem**: `EACCES` or permission denied

**Solutions**:
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Or use a different approach
npm config set prefix ~/.npm-global
```

### 8. **Environment File Issues**

**Problem**: Environment variables not loading

**Check**:
```bash
# Make sure .env file exists
ls -la .env

# Check file contents
cat .env
```

**Create if missing**:
```bash
node setup-env.js
```

## 🔍 Step-by-Step Debugging

### Step 1: Check Prerequisites
```bash
# Check Node.js
node --version

# Check npm
npm --version

# Check MySQL
mysql --version

# Check if MySQL is running
mysql -u root -p
```

### Step 2: Test Database Connection
```bash
# Test with root user
mysql -u root -p

# Test with app user
mysql -u healthapp -p healthconnect
```

### Step 3: Check Environment Variables
```bash
# In your backend directory
cat .env

# Should show:
# DB_HOST=localhost
# DB_USER=healthapp
# DB_PASSWORD=your_password
# DB_NAME=healthconnect
# DB_PORT=3306
```

### Step 4: Test Database Creation
```bash
# Create database manually
mysql -u root -p
CREATE DATABASE IF NOT EXISTS healthconnect;
SHOW DATABASES;
EXIT;
```

### Step 5: Test User Creation
```bash
mysql -u root -p
CREATE USER IF NOT EXISTS 'healthapp'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON healthconnect.* TO 'healthapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 6: Test App User Connection
```bash
mysql -u healthapp -p healthconnect
SHOW TABLES;
EXIT;
```

## 🛠️ Quick Fix Commands

### Reset Everything
```bash
# Stop any running processes
pkill -f node
pkill -f mysql

# Restart MySQL
# Windows: Start XAMPP or restart MySQL service
# macOS: brew services restart mysql
# Linux: sudo systemctl restart mysql

# Clean install
cd doctor-dot-connect/BACKEND/backend
rm -rf node_modules
npm install

# Recreate environment
rm .env
node setup-env.js

# Edit .env with correct credentials
# Then try again
npm run init-db
```

### Alternative Database Setup
```bash
# Use root user instead of healthapp
# Edit .env file:
DB_USER=root
DB_PASSWORD=your_root_password

# Then run
npm run init-db
```

## 📋 Error Messages & Solutions

### `ECONNREFUSED`
- MySQL not running
- Wrong host/port
- Firewall blocking connection

### `Access denied for user`
- Wrong username/password
- User doesn't exist
- User lacks privileges

### `Unknown database`
- Database doesn't exist
- Wrong database name

### `EADDRINUSE`
- Port already in use
- Another process running

### `Cannot find module`
- Missing dependencies
- Wrong Node.js version

### `EACCES`
- Permission issues
- Need sudo/admin rights

## 🆘 Emergency Recovery

If nothing works, try this minimal setup:

```bash
# 1. Use root MySQL user
mysql -u root -p
CREATE DATABASE healthconnect;
EXIT;

# 2. Update .env to use root
DB_USER=root
DB_PASSWORD=your_root_password

# 3. Run initialization
npm run init-db
```

## 📞 Getting Help

If you're still stuck, please share:

1. **Your operating system** (Windows/macOS/Linux)
2. **The exact error message** you're seeing
3. **What step** you're failing at
4. **Your .env file contents** (without passwords)

## 🎯 Success Indicators

You'll know it's working when you see:
```
✅ Database 'healthconnect' is ready
✅ Database connection successful
✅ Tables created successfully
✅ Sample data initialized successfully
🎉 Database initialization completed successfully!
```

## 🚀 Next Steps After Success

Once database initialization works:
1. Start your server: `npm run dev`
2. Test API: `curl http://localhost:5000/health`
3. Test login: Use `patient@example.com` / `patient123`
4. Connect your frontend

Your HealthConnect app will be ready to collect and store data! 🏥💻


