
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle, Lock, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { encryptText, decryptText } from "@/lib/crypto";
import { Skeleton } from "../ui/skeleton";
import type { Note } from "@/lib/types";
import { fetchNotes, addNote, deleteNote } from "@/app/actions/notes-actions";
import { getIdTokenSafely } from "@/lib/firebase/get-id-token";


export default function SecureNotesClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddNoteOpen, setAddNoteOpen] = useState(false);
  const [visibleNoteId, setVisibleNoteId] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState("");

  const refreshNotes = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const idToken = await getIdTokenSafely();
      const fetchedNotes = await fetchNotes(idToken ?? undefined);
      setNotes(fetchedNotes);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could Not Load Notes",
        description: error.message || "There was an error fetching your secure notes.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      refreshNotes();
    }
  }, [user, refreshNotes]);

  const handleAddNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    const formData = new FormData(event.currentTarget);
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const passphrase = formData.get("passphrase") as string;

    if (passphrase.length < 8) {
      toast({
        variant: "destructive",
        title: "Invalid Passphrase",
        description: "Passphrase must be at least 8 characters long.",
      });
      return;
    }

    try {
      const { encryptedText, iv, salt } = await encryptText(content, passphrase);
      const idToken = await getIdTokenSafely();

      const result = await addNote({
        title,
        encryptedContent: encryptedText,
        iv,
        salt,
      }, idToken ?? undefined);

      // Add note to local state immediately (optimistic update)
      const newNote: Note = {
        id: result.id,
        userId: user.uid || "",
        title,
        encryptedContent: encryptedText,
        iv,
        salt,
      };

      setNotes([...notes, newNote]);

      toast({
        title: "Note added",
        description: "Your secure note has been saved.",
      });
      setAddNoteOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could Not Add Note",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    try {
      const idToken = await getIdTokenSafely();
      await deleteNote(noteId, idToken ?? undefined);
      
      setNotes(notes.filter(note => note.id !== noteId));
      toast({ title: "Note Deleted", description: "Your secure note has been removed." });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not delete the note.",
        });
    }
  };
  
  const handleToggleVisibility = async (note: Note) => {
    if (visibleNoteId === note.id) {
      setVisibleNoteId(null);
      setPassphrase("");
      const updatedNotes = notes.map(n => n.id === note.id ? { ...n, decryptedContent: undefined } : n);
      setNotes(updatedNotes);
      return;
    }

    if (!passphrase) {
        toast({ variant: "destructive", title: "Passphrase required", description: "Please enter the passphrase to decrypt this note." });
        return;
    }

    try {
        const decryptedContent = await decryptText(note.encryptedContent, passphrase, note.iv, note.salt);
        const updatedNotes = notes.map(n => n.id === note.id ? { ...n, decryptedContent } : n);
        setNotes(updatedNotes);
        setVisibleNoteId(note.id);
    } catch (error) {
        toast({ variant: "destructive", title: "Decryption Failed", description: "Incorrect passphrase. Please try again." });
    } finally {
        setPassphrase(""); // Clear passphrase input
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Secure Notes</CardTitle>
          <CardDescription>
            Store PINs, passwords, and other sensitive info.
          </CardDescription>
        </div>
        <Dialog open={isAddNoteOpen} onOpenChange={setAddNoteOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleAddNote}>
              <DialogHeader>
                <DialogTitle>Add a Secure Note</DialogTitle>
                <DialogDescription>
                  This note will be end-to-end encrypted. Remember your passphrase.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input id="title" name="title" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="content" className="text-right">
                    Content
                  </Label>
                  <Textarea id="content" name="content" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="passphrase" className="text-right">
                    Passphrase
                  </Label>
                  <Input
                    id="passphrase"
                    name="passphrase"
                    type="password"
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Note</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
           <div className="space-y-2">
             {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
           </div>
        ) : notes.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            <Lock className="mx-auto h-8 w-8 mb-2" />
            No secure notes yet. Add your first one!
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between rounded-lg border p-3 gap-2"
              >
                <div className="flex-1">
                  <p className="font-semibold">{note.title}</p>
                  {visibleNoteId === note.id ? (
                     <p className="text-sm text-foreground font-mono break-all">{note.decryptedContent}</p>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                        <Input 
                            type="password"
                            placeholder="Enter passphrase to view"
                            className="h-8 text-xs"
                            onChange={(e) => setPassphrase(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleToggleVisibility(note)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleToggleVisibility(note)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                    {visibleNoteId === note.id && (
                        <Button variant="ghost" size="icon" onClick={() => handleToggleVisibility(note)}>
                             <EyeOff className="h-4 w-4" />
                        </Button>
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your secure note.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteNote(note.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
