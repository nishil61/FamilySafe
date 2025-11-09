'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import type { VaultItem } from '@/lib/types';

interface VaultItemInput {
  name: string;
  type: 'pin' | 'password' | 'card' | 'atm' | 'other';
  encryptedContent: string;
  iv: string;
  salt: string;
}

// Helper to verify the ID token and get user's UID
async function getUserIdFromToken(idToken: string | undefined): Promise<string> {
  if (!idToken) {
    throw new Error('User not authenticated. No token provided.');
  }

  try {
    const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    throw new Error('User not authenticated. Invalid token.');
  }
}

export async function fetchVaultItems(
  idToken: string | undefined
): Promise<VaultItem[]> {
  const userId = await getUserIdFromToken(idToken);
  const db = getFirestore(adminApp);

  try {
    // Use admin SDK - bypasses security rules entirely
    const vaultSnapshot = await db
      .collection('vault')
      .where('userId', '==', userId)
      .get();

    if (vaultSnapshot.empty) {
      return [];
    }

    const items = vaultSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<VaultItem, 'id'>),
    }));

    return items;
  } catch (error: any) {
    throw new Error(`Failed to fetch vault items: ${error.message}`);
  }
}

export async function addVaultItem(
  item: VaultItemInput,
  idToken: string | undefined
): Promise<{ id: string }> {
  const userId = await getUserIdFromToken(idToken);
  const db = getFirestore(adminApp);

  try {
    // Create a unique idempotency key to prevent duplicates
    const idempotencyKey = `${userId}-${item.name}-${new Date().getTime()}`;

    // Use admin SDK - bypasses security rules entirely
    const itemData = {
      userId,
      name: item.name,
      type: item.type,
      encryptedContent: item.encryptedContent,
      iv: item.iv,
      salt: item.salt,
      idempotencyKey, // Add this to help prevent duplicates
      createdAt: new Date().toISOString(),
    };

    const itemRef = await db.collection('vault').add(itemData);

    return { id: itemRef.id };
  } catch (error: any) {
    throw new Error(`Failed to add vault item: ${error.message}`);
  }
}

export async function deleteVaultItem(
  itemId: string,
  idToken: string | undefined
): Promise<{ success: boolean }> {
  const userId = await getUserIdFromToken(idToken);
  const db = getFirestore(adminApp);

  try {
    // Use admin SDK - bypasses security rules entirely
    const itemRef = db.collection('vault').doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists || itemDoc.data()?.userId !== userId) {
      throw new Error('Permission denied or item not found.');
    }

    await itemRef.delete();
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to delete vault item: ${error.message}`);
  }
}

