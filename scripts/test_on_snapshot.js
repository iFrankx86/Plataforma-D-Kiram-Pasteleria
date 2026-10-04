import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import localConfig from '../firebase-applet-config.json' with { type: 'json' };

const firebaseConfig = {
  projectId: localConfig.projectId || "gen-lang-client-0465390353",
  appId: localConfig.appId || "1:245756189220:web:2d56d594e20507cc8ed6b1",
  apiKey: localConfig.apiKey || "AIzaSyATqYo4gtwpojb6_f_4Ex4Zb0yffK85_Rc",
  authDomain: localConfig.authDomain || "gen-lang-client-0465390353.firebaseapp.com",
  firestoreDatabaseId: localConfig.firestoreDatabaseId || "ai-studio-dkirampastelera-665e9d89-8a5f-4239-b603-233a5ae6e4e6",
  storageBucket: localConfig.storageBucket || "gen-lang-client-0465390353.firebasestorage.app",
  messagingSenderId: localConfig.messagingSenderId || "245756189220"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

console.log('Testing onSnapshot on categories...');
const unsub = onSnapshot(
  collection(db, 'categories'),
  (snap) => {
    console.log('✅ onSnapshot success! Docs:', snap.size);
    unsub();
    process.exit(0);
  },
  (err) => {
    console.error('❌ onSnapshot error:', err.code, err.message);
    process.exit(1);
  }
);
