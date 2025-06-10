
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
// import { Firestore, getFirestore } from 'firebase/firestore'; // Uncomment if you use Firestore

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
// let db: Firestore; // Uncomment if you use Firestore

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // db = getFirestore(app); // Uncomment if you use Firestore
} else if (typeof window !== 'undefined') {
  app = getApp();
  auth = getAuth(app);
  // db = getFirestore(app); // Uncomment if you use Firestore
} else {
  // Handle server-side rendering or environment without window
  // For client-side auth, these might not be strictly necessary on server,
  // but good to have placeholders or conditional logic if Firebase admin SDK is used elsewhere.
}

// @ts-ignore
export { app, auth /*, db */ };
