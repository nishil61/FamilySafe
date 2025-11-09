'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import type { Document } from '@/lib/types';

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

export async function uploadDocument(
  fileData: Uint8Array,
  fileName: string,
  mimeType: string,
  fileSize: number,
  docType: "aadhar" | "pan" | "passport" | "drivers_license" | "custom",
  customLabel: string | undefined,
  notes: string | undefined,
  expiryDate: string | undefined,
  idToken: string | undefined
): Promise<{ id: string; success: boolean }> {
  const userId = await getUserIdFromToken(idToken);
  const db = getFirestore(adminApp);

  try {
    // Create document name
    const docName = customLabel || fileName.split('.')[0];
    
    // Parse expiry date if provided
    let parsedExpiryDate: Date | null = null;
    if (expiryDate) {
      parsedExpiryDate = new Date(expiryDate);
    }

    // Convert Uint8Array to base64 for storage
    const base64FileData = Buffer.from(fileData).toString('base64');

    const documentData = {
      userId,
      name: docName,
      fileName,
      docType,
      customLabel: docType === 'custom' ? (customLabel || '') : '',
      encryptedFileData: base64FileData,
      iv: '', // Not used - documents stored as base64 only
      salt: '', // Not used - documents stored as base64 only
      notes: notes || '',
      expiryDate: parsedExpiryDate,
      uploadedAt: new Date(),
      mimeType,
      size: fileSize,
    };

    const docRef = await db.collection('documents').add(documentData);
    
    return { id: docRef.id, success: true };
  } catch (error: any) {
    throw new Error(`Failed to upload document: ${error.message}`);
  }
}

export async function fetchDocuments(
  idToken: string | undefined
): Promise<Document[]> {
  const userId = await getUserIdFromToken(idToken);
  const db = getFirestore(adminApp);

  try {
    // Fetch without orderBy to avoid composite index requirement
    // Sort client-side instead
    const documentsSnapshot = await db
      .collection('documents')
      .where('userId', '==', userId)
      .get();

    if (documentsSnapshot.empty) {
      return [];
    }

    const documents = documentsSnapshot.docs
      .map((doc) => {
        const data = doc.data() as Omit<Document, 'id'>;
        // Convert Firestore Timestamp to ISO string for client serialization
        return {
          id: doc.id,
          ...data,
          uploadedAt: (data.uploadedAt as any) instanceof Date 
            ? (data.uploadedAt as unknown as Date).toISOString() 
            : (data.uploadedAt as any)?.toDate?.()?.toISOString() || new Date().toISOString(),
          expiryDate: (data.expiryDate as any) instanceof Date
            ? (data.expiryDate as unknown as Date).toISOString()
            : (data.expiryDate as any)?.toDate?.()?.toISOString() || null,
        };
      })
      .sort((a, b) => {
        // Sort by uploadedAt in descending order (newest first)
        const dateA = new Date(a.uploadedAt).getTime();
        const dateB = new Date(b.uploadedAt).getTime();
        return dateB - dateA;
      });

    return documents;
  } catch (error: any) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }
}

export async function deleteDocument(
  documentId: string,
  idToken: string | undefined
): Promise<{ success: boolean }> {
  const userId = await getUserIdFromToken(idToken);
  const db = getFirestore(adminApp);

  try {
    const docRef = db.collection('documents').doc(documentId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error('Document not found.');
    }

    const docData = docSnapshot.data();
    if (docData?.userId !== userId) {
      throw new Error('Permission denied.');
    }

    await docRef.delete();
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

export async function updateDocumentMetadata(
  documentId: string,
  notes: string | undefined,
  customLabel: string | undefined,
  expiryDate: string | undefined,
  idToken: string | undefined
): Promise<{ success: boolean }> {
  const userId = await getUserIdFromToken(idToken);
  const db = getFirestore(adminApp);

  try {
    const docRef = db.collection('documents').doc(documentId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw new Error('Document not found.');
    }

    const docData = docSnapshot.data();
    if (docData?.userId !== userId) {
      throw new Error('Permission denied.');
    }

    const updateData: any = {};
    if (notes !== undefined) updateData.notes = notes;
    if (customLabel !== undefined) updateData.customLabel = customLabel;
    if (expiryDate !== undefined) {
      updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    }

    await docRef.update(updateData);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to update document: ${error.message}`);
  }
}
