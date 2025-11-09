"use server";

import { getFirestore } from "firebase-admin/firestore";
import { adminApp } from "@/lib/firebase/admin";

async function getUserIdFromToken(idToken: string | undefined): Promise<string> {
  if (!idToken) {
    throw new Error("User not authenticated. No token provided.");
  }

  try {
    const { getAuth } = await import("firebase-admin/auth");
    const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    throw new Error("User not authenticated. Invalid token.");
  }
}

export async function deleteUserAccount(idToken: string | undefined): Promise<void> {
  const userId = await getUserIdFromToken(idToken);
  const db = getFirestore(adminApp);

  try {
    const batch = db.batch();

    const userRef = db.collection("users").doc(userId);
    batch.delete(userRef);

    const docsSnapshot = await db.collection("documents").where("userId", "==", userId).get();
    docsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    const vaultSnapshot = await db.collection("vault").where("userId", "==", userId).get();
    vaultSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    const notesSnapshot = await db.collection("notes").where("userId", "==", userId).get();
    notesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
  } catch (error: any) {
    throw new Error(`Failed to delete account data: ${error.message}`);
  }
}
