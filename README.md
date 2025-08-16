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

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
