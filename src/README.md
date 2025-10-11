# Crypto Trading Platform - Frontend

A modern React frontend for the Crypto Trading Platform with real-time trading signals, advanced analytics, and comprehensive user management.

## 🚀 Quick Deploy to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. **Push to GitHub Repository**
   ```bash
   git add .
   git commit -m "Prepare frontend for Vercel deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Set **Root Directory** to `client`
   - Configure environment variables (see below)
   - Click "Deploy"

### Option 2: Deploy with Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from client directory**
   ```bash
   cd client
   vercel --prod
   ```

## 🔧 Environment Configuration

### Required Environment Variables in Vercel

In your Vercel dashboard, add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com` | Your deployed backend API URL |
| `VITE_WS_URL` | `wss://your-backend.onrender.com` | Your deployed backend WebSocket URL |
| `VITE_APP_NAME` | `Crypto Trading Platform` | Application name |
| `VITE_ENVIRONMENT` | `production` | Environment identifier |

### Backend Deployment Options

Deploy your backend first to one of these platforms:

- **Railway**: https://railway.app
- **Render**: https://render.com  
- **Fly.io**: https://fly.io
- **Heroku**: https://heroku.com

Then update the environment variables with your backend URLs.

## 📁 Project Structure

```
client/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── services/          # API services
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies and scripts
```

## 🛠️ Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

## 🌟 Features

- **Real-time Trading Signals** - Live buy/sell alerts
- **Advanced Analytics** - 200-week heatmaps, cycle analysis
- **Multi-ticker Support** - 28+ cryptocurrency pairs
- **Admin Dashboard** - Complete user and system management
- **Responsive Design** - Mobile-first approach
- **Performance Optimized** - Lazy loading and code splitting

## 🔒 Security

- JWT-based authentication
- Role-based access control
- CORS protection
- Input validation
- Secure API communication

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Support

For deployment issues or questions, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://react.dev/)