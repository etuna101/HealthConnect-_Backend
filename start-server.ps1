# HealthConnect Backend Server Starter
Write-Host "🚀 Starting HealthConnect Backend Server..." -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please run: node setup-env.js" -ForegroundColor Yellow
    exit 1
}

# Check if MySQL is accessible
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow
try {
    node -e "require('./config/database').testConnection().then(() => console.log('✅ Database OK')).catch(e => { console.error('❌ Database failed:', e.message); process.exit(1); })"
} catch {
    Write-Host "❌ Database test failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🌐 Starting server on http://localhost:5000" -ForegroundColor Green
Write-Host "📊 Health check: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host ""

# Start the server
try {
    node server.js
} catch {
    Write-Host "❌ Server failed to start!" -ForegroundColor Red
    Write-Host "💡 Try running PowerShell as Administrator" -ForegroundColor Yellow
    pause
}

