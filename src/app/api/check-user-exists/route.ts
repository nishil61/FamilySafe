import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Missing email" },
        { status: 400 }
      );
    }

    const auth = getAuth(adminApp);
    
    try {
      // Try to get the user by email
      await auth.getUserByEmail(email);
      // User exists
      return NextResponse.json({ exists: true });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist
        return NextResponse.json({ exists: false });
      }
      // Some other error
      throw error;
    }
  } catch (error: any) {
    console.error("Check user error:", error);
    return NextResponse.json(
      { error: "Failed to check user" },
      { status: 500 }
    );
  }
}
