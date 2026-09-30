import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import localConfig from '../../firebase-applet-config.json';

// Compatible with both direct file inclusion and Vercel Environment Variables
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId || "gen-lang-client-0465390353",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId || "1:245756189220:web:2d56d594e20507cc8ed6b1",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey || "AIzaSyATqYo4gtwpojb6_f_4Ex4Zb0yffK85_Rc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain || "gen-lang-client-0465390353.firebaseapp.com",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId || "ai-studio-dkirampastelera-665e9d89-8a5f-4239-b603-233a5ae6e4e6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket || "gen-lang-client-0465390353.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId || "245756189220"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client offline or unreachable, continuing with local fallback.");
    }
  }
}

testConnection();

export default app;
