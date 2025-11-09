
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase service account key is already loaded from environment variables
// Next.js automatically loads variables from .env and .env.local

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountString) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}

let serviceAccount: object;
try {
  // The service account key is expected to be base64 encoded in the environment variable.
  const decodedString = Buffer.from(serviceAccountString, 'base64').toString('utf-8');
  serviceAccount = JSON.parse(decodedString);
} catch (e) {
  throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it is a valid Base64-encoded JSON string.');
}

let adminApp: App;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
} else {
  adminApp = getApps()[0];
}

export { adminApp };
export const admin = {
  auth: () => getAuth(adminApp),
  firestore: () => getFirestore(adminApp),
};
