#!/bin/bash

# Selenium to Playwright Converter - Persistent Launcher
# This script ensures the app stays running using PM2

echo "🚀 Starting Selenium-to-Playwright Converter in persistent mode..."

# Stop existing process if any
./node_modules/.bin/pm2 delete selenium-to-playwright 2>/dev/null

# Start the application
./node_modules/.bin/pm2 start ecosystem.config.js

# Save the list for reboot persistence (if pm2 is global)
./node_modules/.bin/pm2 save

echo "--------------------------------------------------------"
echo "✅ Application is now running in the background."
echo "🔗 URL: http://localhost:8080"
echo "📊 Monitoring: Run './node_modules/.bin/pm2 status' to check status"
echo "📝 Logs: Run './node_modules/.bin/pm2 logs' to see real-time output"
echo "--------------------------------------------------------"
