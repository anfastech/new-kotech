# Smart Traffic Management System - Kottakkal

A real-time traffic management system for Kottakkal using Firebase Realtime Database for live data synchronization.

## Features

- Real-time vehicle tracking (ambulances, fire trucks, buses)
- Live incident reporting and management
- Traffic congestion monitoring
- Interactive map with Mapbox integration
- Firebase Realtime Database for live updates

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Real-time Database**: Firebase Realtime Database
- **Maps**: Mapbox GL JS
- **Deployment**: Vercel

## Environment Variables

Create a `.env.local` file in the root directory with the following Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up your environment variables
4. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Realtime Database
3. Set up security rules for your database
4. Copy the configuration values to your environment variables

## Deployment

The project is configured for deployment on Vercel. Make sure to add all environment variables to your Vercel project settings.

## Architecture

- **Real-time Updates**: Uses Firebase Realtime Database for live data synchronization
- **Component Structure**: Modular components with proper separation of concerns
- **State Management**: React Context for global state management
- **Error Handling**: Graceful fallbacks and error boundaries
