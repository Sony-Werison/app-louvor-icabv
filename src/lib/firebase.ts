
import { initializeApp, getApp, getApps } from 'firebase/app';

const firebaseConfig = {
  "projectId": "louvor-icabv",
  "appId": "1:983918160630:web:afbbaf6ba6f3ef9b10dad7",
  "storageBucket": "louvor-icabv.firebasestorage.app",
  "apiKey": "AIzaSyBaIjOhtTvjmHSmIHZYtRyCSxVgX_P4BRc",
  "authDomain": "louvor-icabv.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "983918160630"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
