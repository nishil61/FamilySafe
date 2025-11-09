// src/lib/firebase/get-id-token.ts
import { auth } from './config';

/**
 * Get the current user's Firebase ID token.
 * This function can be used by client components to get a token
 * that can be passed to server actions or API routes.
 */
export async function getIdToken(): Promise<string> {
  if (!auth.currentUser) {
    throw new Error('No user logged in');
  }
  
  try {
    // Try to get cached token first
    const token = await auth.currentUser.getIdToken(false);
    return token;
  } catch (error) {
    // If cached fails, force refresh
    const token = await auth.currentUser.getIdToken(true);
    return token;
  }
}

export async function getIdTokenSafely(): Promise<string | null> {
  try {
    return await getIdToken();
  } catch (error) {
    return null;
  }
}
