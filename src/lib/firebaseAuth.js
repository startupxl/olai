import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  updateProfile,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from './firebase.js';

const googleProvider = new GoogleAuthProvider();

function userFromFirebase(fbUser) {
  return {
    uid: fbUser.uid,
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Writer',
    email: fbUser.email || '',
    photoUrl: fbUser.photoURL || null,
    initials: (fbUser.displayName || fbUser.email || 'OL')
      .split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2),
    color: '#2D6A4F',
    plan: 'Free',
  };
}

export function onAuthChanged(callback) {
  return onAuthStateChanged(auth, fbUser => callback(fbUser ? userFromFirebase(fbUser) : null));
}

export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return userFromFirebase(result.user);
}

export async function signUpWithEmail(name, email, password) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName: name });
  return userFromFirebase(result.user);
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return userFromFirebase(result.user);
}

export async function sendMagicLink(email) {
  const actionCodeSettings = {
    url: `${window.location.origin}/?emailLink=1`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
}

export async function sendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

export function signOut() {
  return firebaseSignOut(auth);
}
