
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore'; // Uncommented

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore; // Uncommented

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app); // Uncommented
} else if (typeof window !== 'undefined') {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app); // Uncommented and ensure it's assigned
} else {
  // Handle server-side rendering or environment without window
  // For client-side auth, these might not be strictly necessary on server,
  // but good to have placeholders or conditional logic if Firebase admin SDK is used elsewhere.
  // If getApps().length > 0 on server, it means an app instance (likely admin) might already exist.
  // For client SDK on server (Next.js RSC/Server Actions), initialize if no apps exist.
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app); // Can be initialized on server for some client SDK uses
  db = getFirestore(app); // Can be initialized on server
}

export { app, auth, db }; // Export db
