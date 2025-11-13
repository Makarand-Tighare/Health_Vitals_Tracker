# Health Vitals Tracking System

A personal health tracking application built with Next.js, Firebase, and TypeScript. Track your daily food intake, Apple Watch activity, hydration, sleep, and health metrics with automatic calorie calculations and weekly summaries.

## Features

### ✅ Core Features

1. **Daily Food Log** - Multi-select food items for breakfast, lunch, snacks, dinner, and extra meals
2. **Activity Tracking** - Manual entry of active calories, resting calories, and workout time
3. **Health Inputs** - Log wake time, sleep time, water intake, fruit intake, green tea count, food quality score, face status, and notes
4. **Auto Calculations** - Automatically calculates total intake, total burn, calorie deficit, and trend indicators
5. **Weekly Summary Dashboard** - Shows averages for intake, burn, deficit, sleep, water, food quality, and face trends
6. **Food Database** - Pre-populated database with calorie values for common foods
7. **Firebase Authentication** - Secure user authentication and data storage

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Firebase** (Firestore + Authentication)
- **Tailwind CSS**
- **React 19**

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Firebase project set up

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable **Email/Password** provider
4. Enable **Firestore Database**:
   - Go to Firestore Database
   - Create database in **production mode** (or test mode for development)
   - Set up security rules (see below)

### Firestore Security Rules

Add these rules to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /dailyEntries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd health-vitals-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory:
   ```bash
   cp .env.local.example .env.local
   ```

4. Add your Firebase configuration to `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

   You can find these values in Firebase Console → Project Settings → General → Your apps

4. (Optional) Add Google Gemini API key for AI calorie estimation:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   This enables AI-powered calorie estimation for custom foods. If not provided, the app will use a fallback estimation method.
   
   To get a Gemini API key:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key and add it to `.env.local`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Sign Up / Sign In**: Create an account or sign in with your email and password
2. **Daily Entry**: 
   - Select foods for each meal (breakfast, lunch, snacks, dinner, extra)
   - Enter your activity data (active calories, resting calories, workout time)
   - Fill in health inputs (sleep, water, food quality, etc.)
   - View auto-calculated metrics (intake, burn, deficit, trend)
   - Click "Save Entry" to save your data
3. **Weekly Summary**: Navigate to the Weekly Summary page to see your weekly averages and trends

## Project Structure

```
health-vitals-tracker/
├── app/
│   ├── dashboard/          # Daily entry page
│   ├── weekly/             # Weekly summary page
│   ├── layout.tsx          # Root layout with AuthProvider
│   └── page.tsx            # Home/login page
├── components/
│   ├── auth/               # Authentication components
│   └── dashboard/          # Dashboard components
├── contexts/
│   └── AuthContext.tsx     # Firebase Auth context
├── lib/
│   ├── firebase/           # Firebase config and DB functions
│   ├── foodDatabase.ts     # Food database with calories
│   ├── calculations.ts     # Calculation utilities
│   └── weeklySummary.ts    # Weekly summary calculations
├── types/
│   └── index.ts            # TypeScript type definitions
└── README.md
```

## Food Database

The app includes a pre-populated food database with calorie values. You can extend it by editing `lib/foodDatabase.ts`. The database includes:

- Breakfast items (Poha, Dosa, Idli, etc.)
- Main dishes (Chapati, Rice, Chole, Paneer, etc.)
- Snacks (Samosa, Pakora, Nuts, etc.)
- Beverages (Green Tea, Coffee, Milk, etc.)
- Desserts (Ice Cream, Sweets, Chocolate, etc.)

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your Firebase environment variables in Vercel project settings
4. Deploy!

The app will automatically build and deploy.

## Future Enhancements

- [ ] AI suggestions for next day's diet
- [ ] Visual graphs of calorie deficit trends
- [ ] Enhanced hydration tracking
- [ ] Weekly body progress photos
- [ ] Export data to CSV/PDF
- [ ] Mobile app version

## License

This project is for personal use.
