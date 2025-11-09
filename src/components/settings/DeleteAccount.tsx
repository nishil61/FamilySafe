"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { deleteUserAccount } from "@/app/actions/user-actions";
import { getIdTokenSafely } from "@/lib/firebase/get-id-token";

export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { toast } = useToast();
  const { logout } = useAuth();
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please type "DELETE" to confirm account deletion.',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const idToken = await getIdTokenSafely();
      if (!idToken) {
        throw new Error("Unable to authenticate. Please sign in again.");
      }

      // Step 1: Delete Firestore data using server action
      await deleteUserAccount(idToken);

      // Step 2: Delete from Firebase Auth using API endpoint
      const authResponse = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        
        // Check if it's a permission error
        if (authResponse.status === 403) {
          throw new Error(errorData.error + "\n\nPlease contact support or grant the service account Editor role in Firebase Console.");
        }
        
        throw new Error(errorData.error || "Failed to complete account deletion");
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      await logout();
      router.push("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Deleting Account",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsDeleting(false);
      setOpen(false);
      setConfirmText("");
    }
  };

  return (
    <>
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setOpen(true)}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete My Account"}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data including documents, vault items, and notes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded bg-red-50 p-3">
            <p className="text-sm font-medium text-red-900">
              Type "DELETE" to confirm:
            </p>
            <input
              type="text"
              placeholder='Type "DELETE" to confirm'
              className="mt-2 w-full rounded border border-red-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting || confirmText.trim().toUpperCase() !== "DELETE"}
              className="bg-destructive hover:bg-destructive/90 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
