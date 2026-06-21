// src/firebase/config.js
// ─────────────────────────────────────────────────────────────────
//  SETUP INSTRUCTIONS:
//  1. Go to https://console.firebase.google.com
//  2. Create a new project named "ShorthandPro"
//  3. Enable Authentication → Email/Password
//  4. Create Firestore Database (start in production mode)
//  5. Enable Storage (for audio files)
//  6. Register a Web App and copy the config below
//  7. Replace ALL the placeholder values with your actual config
// ─────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

export const isFirebaseConfigured = !Object.values(firebaseConfig).some(value =>
  typeof value !== 'string' || value.startsWith('YOUR_')
);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
