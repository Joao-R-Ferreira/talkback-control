#!/bin/zsh

# start-dev.sh - MacOS equivalent of Windows start-dev.ps1
echo "🚀 Starting TalkBackControl..."

# Fix execute permissions on binaries (macOS issue)
echo "🔧 Checking permissions..."
chmod -R +x backend/node_modules/.bin 2>/dev/null || true
chmod -R +x frontend/node_modules/.bin 2>/dev/null || true

# Start backend em background (salva PID)
cd backend && npm run dev &
BACKEND_PID=$!
echo "✅ Backend PID: $BACKEND_PID"

# Start frontend em background (salva PID)  
cd ../frontend && npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend PID: $FRONTEND_PID"
echo "SERVER STARTED with Backend PID: $BACKEND_PID and Frontend PID: $FRONTEND_PID"

echo ""
echo "Press any key to STOP... (Ctrl+C também funciona)"
read -k 1

echo ""
echo "🛑 Force killing ENTIRE process trees..."
kill -TERM $BACKEND_PID 2>/dev/null
kill -TERM $FRONTEND_PID 2>/dev/null
sleep 2
kill -KILL $BACKEND_PID 2>/dev/null
kill -KILL $FRONTEND_PID 2>/dev/null
echo "✅ Everything stopped!"
