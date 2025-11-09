"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusCircle, Eye, EyeOff, Trash2, Copy, Lock, CreditCard } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { encryptText, decryptText } from "@/lib/crypto";
import { Skeleton } from "../ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { VaultItem } from "@/lib/types";
import {
  fetchVaultItems,
  addVaultItem,
  deleteVaultItem,
} from "@/app/actions/vault-actions";
import { getIdTokenSafely } from "@/lib/firebase/get-id-token";
import { useUnlock } from "@/context/UnlockContext";

type VaultItemType = "pin" | "password" | "card" | "atm" | "other";

interface VaultItemForm {
  name: string;
  type: VaultItemType;
  content: string;
}

export default function SecureVault() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { vaultPassword } = useUnlock();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [revealedItemId, setRevealedItemId] = useState<string | null>(null);
  const [revealedContents, setRevealedContents] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<VaultItemForm>({
    name: "",
    type: "password",
    content: "",
  });

  const refreshItems = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const idToken = await getIdTokenSafely();
      if (!idToken) {
        throw new Error("Unable to authenticate");
      }
      const fetchedItems = await fetchVaultItems(idToken);
      setItems(fetchedItems);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could Not Load Vault",
        description:
          error.message || "There was an error fetching your vault items.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      refreshItems();
    }
  }, [user, refreshItems]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Name",
        description: "Please enter a name for this vault item.",
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Content",
        description: "Please enter the content to store.",
      });
      return;
    }

    if (!vaultPassword) {
      toast({
        variant: "destructive",
        title: "Vault Not Configured",
        description: "Vault password not set. Please set it up first.",
      });
      return;
    }

    try {
      const { encryptedText, iv, salt } = await encryptText(
        formData.content,
        vaultPassword
      );

      const idToken = await getIdTokenSafely();
      if (!idToken) {
        throw new Error("Unable to authenticate");
      }

      const result = await addVaultItem(
        {
          name: formData.name,
          type: formData.type,
          encryptedContent: encryptedText,
          iv,
          salt,
        },
        idToken
      );

      // Add the new item to local state immediately (optimistic update)
      const newItem: VaultItem = {
        id: result.id,
        userId: user.uid || "",
        name: formData.name,
        type: formData.type,
        encryptedContent: encryptedText,
        iv,
        salt,
      };
      
      setItems([...items, newItem]);

      toast({
        title: "Item Saved",
        description: "Your vault item has been securely stored.",
      });

      setFormData({
        name: "",
        type: "password",
        content: "",
      });
      setIsAddOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could Not Save Item",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const handleRevealItem = async (item: VaultItem) => {
    if (revealedItemId === item.id) {
      setRevealedItemId(null);
      // Clear from contents cache
      setRevealedContents(prev => {
        const updated = { ...prev };
        delete updated[item.id];
        return updated;
      });
      return;
    }

    if (!vaultPassword) {
      toast({
        variant: "destructive",
        title: "Vault Password Required",
        description: "Vault password not available. Please unlock the vault.",
      });
      return;
    }

    try {
      // Verify item has all required fields for decryption
      if (!item.encryptedContent || !item.iv || !item.salt) {
        throw new Error("Vault item is missing encryption data");
      }

      const decrypted = await decryptText(
        item.encryptedContent,
        vaultPassword,
        item.iv,
        item.salt
      );
      setRevealedItemId(item.id);
      setRevealedContents(prev => ({
        ...prev,
        [item.id]: decrypted
      }));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Decryption Failed",
        description: error.message || "Could not decrypt item. Vault password might be incorrect or the item data is corrupted.",
      });
    }
  };

  const handleCopyToClipboard = async (item: VaultItem) => {
    if (!vaultPassword) {
      toast({
        variant: "destructive",
        title: "Vault Password Required",
        description: "Vault password not available. Please unlock the vault.",
      });
      return;
    }

    try {
      const decrypted = await decryptText(
        item.encryptedContent,
        vaultPassword,
        item.iv,
        item.salt
      );
      await navigator.clipboard.writeText(decrypted);
      toast({
        title: "Copied",
        description: "Item copied to clipboard (will clear in 30 seconds).",
      });
      setTimeout(() => {
        navigator.clipboard.writeText("");
      }, 30000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could Not Copy",
        description: "Decryption failed or copy failed.",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;
    try {
      const idToken = await getIdTokenSafely();
      if (!idToken) {
        throw new Error("Unable to authenticate");
      }
      await deleteVaultItem(itemId, idToken);
      setItems(items.filter((item) => item.id !== itemId));
      toast({
        title: "Item Deleted",
        description: "Your vault item has been removed.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could Not Delete Item",
        description: error.message || "An error occurred.",
      });
    }
  };

  const getItemIcon = (type: VaultItemType) => {
    switch (type) {
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "pin":
      case "password":
      case "atm":
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  const getItemTypeLabel = (type: VaultItemType) => {
    const labels: Record<VaultItemType, string> = {
      pin: "PIN",
      password: "Password",
      card: "Card Details",
      atm: "ATM Info",
      other: "Other",
    };
    return labels[type];
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Secure Vault
          </CardTitle>
          <CardDescription>
            Encrypted storage for PINs, passwords, cards, and sensitive info
          </CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleAddItem}>
              <DialogHeader>
                <DialogTitle>Add to Secure Vault</DialogTitle>
                <DialogDescription>
                  Store PINs, passwords, card details, and other sensitive information securely.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., ATM Card, Gmail Password, Bank PIN"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: string) => {
                      setFormData({
                        ...formData,
                        type: value as VaultItemType,
                      });
                    }}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pin">PIN</SelectItem>
                      <SelectItem value="password">Password</SelectItem>
                      <SelectItem value="card">Card Details</SelectItem>
                      <SelectItem value="atm">ATM Info</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Input
                    id="content"
                    type="password"
                    placeholder="Enter the sensitive information"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save to Vault</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">
            <Lock className="mx-auto h-10 w-10 mb-3 opacity-50" />
            <p>Your vault is empty</p>
            <p className="text-xs mt-1">Add your first item to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="text-muted-foreground">{getItemIcon(item.type)}</div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getItemTypeLabel(item.type)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {revealedItemId === item.id ? (
                    <>
                      <div className="text-sm font-mono bg-muted px-3 py-2 rounded max-w-xs break-all text-foreground select-text">
                        {revealedContents[item.id] || '●●●●●●●●'}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyToClipboard(item)}
                        className="h-8 w-8"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRevealItem(item)}
                        className="h-8 w-8"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevealItem(item)}
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{item.name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteItem(item.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
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
