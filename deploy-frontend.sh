#!/bin/bash
# Frontend-Only Deployment Script
# Deploy to different platforms

echo "🎨 Frontend Deployment Script"
echo "First, let's update your backend URL..."

read -p "Enter your backend URL (e.g., https://your-backend.railway.app): " backend_url

# Update .env file
echo "VITE_API_BASE_URL=$backend_url" > .env
echo "VITE_WS_URL=${backend_url/https/wss}" >> .env

echo "✅ Updated .env with backend URL: $backend_url"

echo ""
echo "Choose your frontend deployment platform:"
echo "1. Vercel (Recommended)"
echo "2. Netlify"
echo "3. AWS S3 + CloudFront"
echo "4. Build only (manual upload)"

read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo "🚀 Deploying to Vercel..."
    npm install -g vercel
    vercel login
    echo "During setup, make sure to add these environment variables:"
    echo "VITE_API_BASE_URL=$backend_url"
    echo "VITE_WS_URL=${backend_url/https/wss}"
    vercel
    echo "✅ Frontend deployed to Vercel!"
    ;;
  2)
    echo "🚀 Building for Netlify..."
    npm run build
    echo "✅ Build complete! Upload the dist/ folder to Netlify"
    echo "Don't forget to add environment variables in Netlify dashboard:"
    echo "VITE_API_BASE_URL=$backend_url"
    echo "VITE_WS_URL=${backend_url/https/wss}"
    ;;
  3)
    echo "🚀 Building for AWS S3..."
    npm run build
    echo "✅ Build complete! Upload the dist/ folder to your S3 bucket"
    echo "Configure CloudFront and add environment variables"
    ;;
  4)
    echo "🚀 Building for manual deployment..."
    npm run build
    echo "✅ Build complete! The dist/ folder contains your static files"
    echo "Upload to any static hosting service"
    ;;
  *)
    echo "❌ Invalid choice. Please run the script again."
    ;;
esac

echo ""
echo "🔗 Configuration Summary:"
echo "Backend URL: $backend_url"
echo "WebSocket URL: ${backend_url/https/wss}"
echo ""
echo "🧪 Test your deployment:"
echo "1. Visit your frontend URL"
echo "2. Check if market data loads"
echo "3. Try logging in/registering"
echo "4. Verify real-time price updates"