@echo off
echo Starting HealthConnect Backend Server...
echo.
echo Make sure you have:
echo 1. MySQL running on localhost:3306
echo 2. Database 'healthconnect' created
echo 3. .env file configured
echo.
echo Starting server on port 5000...
echo.
node server.js
pause

