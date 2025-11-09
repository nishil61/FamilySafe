
import { NextResponse } from 'next/server';
import { fetchNotes, addNote, deleteNote } from '@/app/actions/notes-actions';
import { headers } from 'next/headers';

// This route acts as a secure proxy to the Server Actions.
// It ensures that the Authorization header is correctly passed and handled.
export async function POST(request: Request) {
  try {
    // Extract the Authorization header
    const authHeader = request.headers.get('authorization');
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    
    const { action, payload } = await request.json();

    let result;
    switch (action) {
      case 'fetchNotes':
        result = await fetchNotes(idToken);
        break;
      case 'addNote':
        result = await addNote(payload, idToken);
        break;
      case 'deleteNote':
        result = await deleteNote(payload.noteId, idToken);
        break;
      default:
        throw new Error('Invalid action');
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}
