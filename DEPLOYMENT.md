# Deployment Guide

This app is split into two separate services:
1. **Next.js App** - Frontend and API routes (deploy to Vercel)
2. **Socket.IO Server** - Real-time chat service (deploy to Railway/Render)

## Requirements

- **Node.js**: Version 20.x or higher (22.x recommended)
- **npm**: Version 10.x or higher
- **PostgreSQL**: Database for both services

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Next.js App   │────────▶│  Socket.IO Server │
│   (Vercel)      │  HTTP   │  (Railway/Render)│
│   Port 3000     │         │   Port 3001      │
└─────────────────┘         └──────────────────┘
        │                            │
        └────────────┬────────────────┘
                     │
              ┌──────▼──────┐
              │  PostgreSQL  │
              │   Database   │
              └─────────────┘
```

## Environment Variables

### Next.js App (Vercel)
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_SOCKET_URL=https://your-socket-service.railway.app
```

### Socket.IO Server (Railway/Render)
```env
DATABASE_URL=postgresql://...
FRONTEND_URL=https://your-app.vercel.app
SOCKET_PORT=3001
NODE_ENV=production
```

## Deployment Steps

### 1. Deploy Next.js to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Add environment variables (see above)
5. Deploy!

**Note**: Vercel will automatically detect Next.js and use `next dev`/`next start`. The custom `server.js` is no longer needed for Vercel deployment.

### 2. Deploy Socket.IO Server to Railway

#### Option A: Using Railway Dashboard

1. Go to [Railway](https://railway.app) and create a new project
2. Click "New" → "GitHub Repo" and select your repository
3. Railway will auto-detect Node.js
4. Configure:
   - **Root Directory**: `/` (root)
   - **Start Command**: `npm run start:socket`
   - **Build Command**: `npm install && npx prisma generate`
5. Add environment variables (see above)
6. Set `SOCKET_PORT` to `3001` (or Railway's assigned port)
7. Deploy!

#### Option B: Using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to existing project or create new
railway link

# Set environment variables
railway variables set DATABASE_URL=...
railway variables set FRONTEND_URL=https://your-app.vercel.app
railway variables set SOCKET_PORT=3001
railway variables set NODE_ENV=production

# Deploy
railway up
```

### 3. Deploy Socket.IO Server to Render

1. Go to [Render](https://render.com) and create a new "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `poll-app-socket`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npm run start:socket`
   - **Plan**: Starter (or higher)
4. Add environment variables (see above)
5. Render will assign a port automatically (check `PORT` env var)
6. Deploy!

### 4. Update Frontend URL

After deploying Socket.IO server, update your Next.js environment variable:

```env
NEXT_PUBLIC_SOCKET_URL=https://your-socket-service.railway.app
```

Or for Render:
```env
NEXT_PUBLIC_SOCKET_URL=https://your-socket-service.onrender.com
```

**Important**: Redeploy your Next.js app after updating this variable.

## Docker Deployment (Alternative)

If you prefer Docker, you can use the provided `Dockerfile.socket`:

```bash
# Build image
docker build -f Dockerfile.socket -t poll-app-socket .

# Run container
docker run -p 3001:3001 \
  -e DATABASE_URL=... \
  -e FRONTEND_URL=... \
  -e SOCKET_PORT=3001 \
  poll-app-socket
```

## Local Development

Run both services locally:

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Socket.IO
npm run dev:socket
```

Or use concurrently (runs both in one terminal):

```bash
npm run dev:all
```

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Health Checks

Both services have health check endpoints:

- **Next.js**: `http://localhost:3000/health`
- **Socket.IO**: `http://localhost:3001/health`

## Troubleshooting

### Socket.IO not connecting

1. Check `NEXT_PUBLIC_SOCKET_URL` is set correctly
2. Verify CORS settings in `socket-server.js` allow your frontend URL
3. Check Socket.IO server logs for connection errors
4. Ensure both services can access the same database

### CORS Errors

Update `socket-server.js` CORS origin to match your frontend URL:
```javascript
const frontendUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
```

### Database Connection Issues

Both services need access to the same `DATABASE_URL`. Ensure:
- Database is accessible from both services
- Connection pool limits are appropriate
- Prisma migrations are run

## Scaling

### Horizontal Scaling Socket.IO

To scale Socket.IO across multiple instances, add Redis adapter (see main README for Redis setup).

### Cost Optimization

- **Vercel**: Free tier for Next.js (hobby plan)
- **Railway**: $5/month starter plan
- **Render**: Free tier available (with limitations)

Total: ~$5-10/month for small deployments.

