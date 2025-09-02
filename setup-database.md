# Database Setup Guide for HealthConnect

## 1. Install MySQL

### On Windows:
1. Download MySQL from [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)
2. Run the installer and follow the setup wizard
3. Remember your root password!

### On macOS:
```bash
# Using Homebrew
brew install mysql
brew services start mysql
```

### On Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

## 2. Secure MySQL Installation
```bash
sudo mysql_secure_installation
```
Follow the prompts to set up security.

## 3. Create Database and User
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE healthconnect;

# Create a dedicated user for the app
CREATE USER 'healthapp'@'localhost' IDENTIFIED BY 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON healthconnect.* TO 'healthapp'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

## 4. Test Connection
```bash
# Test the new user
mysql -u healthapp -p healthconnect
```

