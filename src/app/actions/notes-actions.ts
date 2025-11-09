
'use server';
/**
 * @fileOverview Secure note management server actions.
 * These actions run exclusively on the server and are called by client components.
 * They handle storing and retrieving ENCRYPTED data from Firestore.
 * All encryption/decryption happens on the client.
 */

import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import type { Note } from '@/lib/types';


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


export async function fetchNotes(idToken: string | undefined): Promise<Note[]> {
    const userId = await getUserIdFromToken(idToken);
    const db = getFirestore(adminApp);
    
    try {
        const notesQuery = db.collection('notes').where('userId', '==', userId);
        const notesSnapshot = await notesQuery.get();

        if (notesSnapshot.empty) {
          return [];
        }

        const notes = notesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Note, 'id' | 'decryptedContent'>),
        }));

        return notes;
    } catch (error: any) {
        throw new Error(`Failed to fetch notes: ${error.message}`);
    }
}

// This action now receives already-encrypted data from the client.
export async function addNote(input: {
  title: string;
  encryptedContent: string;
  iv: string;
  salt: string;
}, idToken: string | undefined): Promise<{ id: string }> {
    const userId = await getUserIdFromToken(idToken);
    const db = getFirestore(adminApp);

    try {
        const noteData = {
          userId,
          title: input.title,
          encryptedContent: input.encryptedContent,
          iv: input.iv,
          salt: input.salt,
          createdAt: new Date().toISOString(),
        };

        const noteRef = await db.collection("notes").add(noteData);

        return { id: noteRef.id };
    } catch (error: any) {
        throw new Error(`Failed to add note: ${error.message}`);
    }
}

export async function deleteNote(noteId: string, idToken: string | undefined): Promise<{ success: boolean }> {
    const userId = await getUserIdFromToken(idToken);
    const db = getFirestore(adminApp);
    
    try {
        const noteRef = db.collection('notes').doc(noteId);
        // Fetch the document to verify ownership before deleting.
        const noteDoc = await noteRef.get();

        if (!noteDoc.exists || noteDoc.data()?.userId !== userId) {
          throw new Error("Permission denied or note not found.");
        }

        await noteRef.delete();
        return { success: true };
    } catch (error: any) {
        throw new Error(`Failed to delete note: ${error.message}`);
    }
}
