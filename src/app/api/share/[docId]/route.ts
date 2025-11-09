'use server';

import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { docId } = await params;
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);

    // Verify ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Fetch document from Firestore
    const docRef = admin.firestore().collection('documents').doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const document = docSnap.data();

    // Allow any authenticated user to view shared documents
    // This is a public share link feature - if someone has the link and is logged in, they can view it
    // If you want to restrict to only the owner, uncomment the check below:
    // if (document?.userId !== userId) {
    //   return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    // }

    // Return document data
    return NextResponse.json({
      id: docSnap.id,
      ...document,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}
