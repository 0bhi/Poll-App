# Architecture Overview

## Service Separation

This application has been refactored to use a **split architecture** where Socket.IO runs as a separate service from Next.js.

### Why Split?

1. **Simplified Deployment**: Next.js can deploy to Vercel (no custom server needed)
2. **Better Scaling**: Socket.IO service can scale independently
3. **Clear Separation**: Each service has a single responsibility
4. **Easier Maintenance**: Changes to one service don't affect the other

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
└───────────────┬───────────────────┬───────────────────┘
                 │                     │
                 │ HTTP                │ WebSocket
                 │                     │
        ┌────────▼────────┐   ┌───────▼──────────┐
        │   Next.js App    │   │  Socket.IO       │
        │   (Vercel)       │   │  Server          │
        │   Port 3000     │   │  (Railway)       │
        │                  │   │  Port 3001       │
        │  - Frontend      │   │                  │
        │  - API Routes    │   │  - Real-time     │
        │  - SSR/SSG       │   │    chat          │
        │  - Auth          │   │  - Notifications │
        └────────┬─────────┘   └───────┬──────────┘
                 │                     │
                 └──────────┬──────────┘
                            │
                    ┌───────▼────────┐
                    │   PostgreSQL   │
                    │   Database     │
                    └────────────────┘
```

## File Structure

```
Poll-App/
├── socket-server.js          # Socket.IO service (separate)
├── app/                       # Next.js app directory
│   ├── components/
│   │   └── chat/
│   │       └── ChatProvider.tsx  # Connects to socket-server.js
│   └── lib/
│       └── db.ts             # Shared Prisma instance
├── package.json              # Scripts for both services
├── railway.json              # Railway deployment config
├── render.yaml               # Render deployment config
├── Dockerfile.socket         # Docker config for Socket.IO
└── DEPLOYMENT.md             # Deployment instructions
```

## Communication Flow

### 1. User Authentication
- User logs in via Next.js (NextAuth)
- Session stored in Next.js
- Socket.IO receives user ID on connection

### 2. Real-time Chat
```
User sends message
  ↓
Next.js API route saves to DB
  ↓
Socket.IO server broadcasts to room
  ↓
Other users receive via WebSocket
```

### 3. Notifications
```
Event occurs (vote, comment, etc.)
  ↓
Next.js API route creates notification in DB
  ↓
Socket.IO server emits to user
  ↓
User receives real-time notification
```

## Environment Variables

### Next.js Service
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - Auth secret
- `NEXTAUTH_URL` - Frontend URL
- `GOOGLE_CLIENT_ID` - OAuth
- `GOOGLE_CLIENT_SECRET` - OAuth
- `NEXT_PUBLIC_SOCKET_URL` - Socket.IO server URL (exposed to client)

### Socket.IO Service
- `DATABASE_URL` - Same PostgreSQL (shared)
- `FRONTEND_URL` - Next.js app URL (for CORS)
- `SOCKET_PORT` - Port to run on (default: 3001)
- `NODE_ENV` - Environment

## Development Workflow

### Local Development
```bash
# Run both services
npm run dev:all

# Or separately
npm run dev          # Next.js on :3000
npm run dev:socket   # Socket.IO on :3001
```

### Production Deployment
1. Deploy Next.js to Vercel
2. Deploy Socket.IO to Railway/Render
3. Set `NEXT_PUBLIC_SOCKET_URL` in Vercel
4. Set `FRONTEND_URL` in Socket.IO service

## Benefits of This Architecture

✅ **Vercel Deployment**: Next.js can use Vercel's optimizations
✅ **Independent Scaling**: Scale Socket.IO separately from web app
✅ **Cost Effective**: Pay only for what you need
✅ **Easier Debugging**: Clear separation of concerns
✅ **Flexibility**: Can swap Socket.IO for other real-time solutions

## Future Improvements

1. **Redis Adapter**: Add Redis for horizontal scaling of Socket.IO
2. **Load Balancer**: Multiple Socket.IO instances behind load balancer
3. **Monitoring**: Separate monitoring for each service
4. **Caching**: Add Redis cache layer for Next.js API routes

