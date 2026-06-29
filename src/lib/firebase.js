import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyB0truD4GAgK-w-Xu2S7uwO73k6bFzGWzQ',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'olai-dc635.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'olai-dc635',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'olai-dc635.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '748648366466',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Use persistent cache with multi-tab support for offline-first behaviour
export const db = initializeFirestore(app, {
  cache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
