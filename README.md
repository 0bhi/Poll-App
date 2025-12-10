# Poll-App

A modern, mobile-responsive polling application built with Next.js, TypeScript, and Tailwind CSS.

## Features

### 🎯 Core Features

- **Create and Vote on Polls**: Interactive polling system with real-time updates
- **User Authentication**: Secure login/signup with Google OAuth and email/password
- **Real-time Chat**: Socket.io powered messaging system
- **Notifications**: Real-time notifications for votes, comments, and follows
- **Responsive Design**: Fully mobile-responsive with touch-optimized interface

### 📱 Mobile-First Design

- **Mobile Navigation**: Slide-out navigation menu for mobile devices
- **Touch-Optimized**: All interactive elements meet 44px minimum touch target size
- **Responsive Layout**: Adaptive grid layouts that work on all screen sizes
- **Mobile Notifications**: Overlay notifications panel for mobile
- **Floating Action Button**: Quick access to create polls on mobile
- **Smooth Scrolling**: Optimized scrolling performance on mobile devices

### 🎨 UI/UX Improvements

- **Modern Design**: Gradient backgrounds and glassmorphism effects
- **Dark Theme**: Built-in dark mode support
- **Loading States**: Skeleton loaders and smooth transitions
- **Accessibility**: ARIA labels and keyboard navigation support
- **Performance**: Optimized images and lazy loading

## Getting Started

### Prerequisites

- **Node.js**: Version 20.x or higher (22.x recommended)
- **npm**: Version 10.x or higher
- **PostgreSQL**: Database server

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `env.example` to `.env.local` and fill in your values:
   ```bash
   cp env.example .env.local
   ```

3. **Set up the database:**
   ```bash
   npx prisma migrate dev
   ```

### Running Locally

This app consists of two separate services:

**Option 1: Run both services together (recommended for development):**
```bash
npm run dev:all
```

**Option 2: Run services separately:**
```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Socket.IO server
npm run dev:socket
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

**Note:** The Socket.IO server runs on port 3001 by default. Make sure `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001` is set in your `.env.local`.

### Architecture

The app is split into two services:
- **Next.js App** (port 3000): Frontend and API routes
- **Socket.IO Server** (port 3001): Real-time chat and notifications

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## Mobile Responsiveness

The app is fully optimized for mobile devices with the following features:

### 📱 Mobile Navigation

- **Hamburger Menu**: Slide-out navigation on mobile devices
- **Touch-Friendly**: Large touch targets (44px minimum)
- **Smooth Animations**: CSS transitions for better UX
- **Overlay Menus**: Full-screen overlays for navigation and notifications

### 🎯 Touch Optimization

- **Button Sizes**: All buttons meet accessibility guidelines
- **Form Inputs**: Optimized input fields for mobile keyboards
- **Poll Options**: Single-column layout on mobile for better readability
- **Action Buttons**: Spaced appropriately for thumb navigation

### 📐 Responsive Breakpoints

- **Mobile**: < 768px (default)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### 🎨 Mobile-Specific Styling

- **Safe Areas**: Support for iPhone notch and Android status bars
- **Viewport Meta**: Proper viewport configuration
- **Touch Scrolling**: Smooth scrolling with momentum
- **Text Sizing**: Readable font sizes on all devices

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom mobile utilities
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Real-time**: Socket.io for chat and notifications
- **Deployment**: Vercel-ready configuration

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deployment

This app uses a **split architecture** for easier deployment:

- **Next.js App**: Deploy to [Vercel](https://vercel.com) (no custom server needed!)
- **Socket.IO Server**: Deploy to [Railway](https://railway.app) or [Render](https://render.com)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. **Deploy Next.js to Vercel:**
   - Connect your GitHub repo
   - Vercel auto-detects Next.js
   - Add environment variables
   - Deploy!

2. **Deploy Socket.IO to Railway:**
   - Create new project
   - Set start command: `npm run start:socket`
   - Add environment variables
   - Deploy!

3. **Update `NEXT_PUBLIC_SOCKET_URL`** in Vercel with your Socket.IO service URL
