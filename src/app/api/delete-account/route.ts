import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "Missing authentication token" },
        { status: 401 }
      );
    }

    // Verify the token
    const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Delete the user from Firebase Auth
    // The Firestore data has already been deleted by the server action
    await getAuth(adminApp).deleteUser(userId);

    return NextResponse.json(
      { success: true, message: "Account successfully deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Delete account error:", error);
    
    // Check for specific Firebase error codes
    const isPermissionError = 
      error.code?.includes('403') || 
      error.message?.includes('does not have permission') ||
      error.message?.includes('PERMISSION_DENIED');
    
    const isUserNotFoundError = error.code === "auth/user-not-found";
    
    let errorMessage = "Failed to delete account";
    let statusCode = 500;
    
    if (isPermissionError) {
      errorMessage = "Account data was deleted, but we couldn't remove the authentication record. Please contact support. Error: Missing IAM permissions on Firebase service account.";
      statusCode = 403;
    } else if (isUserNotFoundError) {
      errorMessage = "User account not found";
      statusCode = 404;
    } else {
      errorMessage = error.message || "Failed to delete account";
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
