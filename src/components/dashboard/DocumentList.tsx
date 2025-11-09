
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { MoreHorizontal, FileText, Share2, Trash2, Download, Edit, AlertCircle, Eye } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PDFViewer from "./PDFViewer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { fetchDocuments, deleteDocument } from "@/app/actions/documents-actions";
import { getIdTokenSafely } from "@/lib/firebase/get-id-token";
import { Document } from "@/lib/types";
import { base64ToObjectURL, base64ToUint8Array, formatFileSize } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUnlock } from "@/context/UnlockContext";
import { format } from "date-fns";

interface DocumentListProps {
  refreshTrigger?: number;
}

export default function DocumentList({ refreshTrigger }: DocumentListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isDocumentsUnlocked } = useUnlock();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'download' | 'share'>('view');
  const [isProcessing, setIsProcessing] = useState(false);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  
  // Edit metadata dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editExpiryDate, setEditExpiryDate] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  // Auto-load document when view dialog opens in 'view' mode
  useEffect(() => {
    if (viewDialogOpen && viewMode === 'view' && selectedDocId && !decryptedUrl && !isProcessing) {
      handleProcessDocument();
    }
  }, [viewDialogOpen, viewMode, selectedDocId]);

  const loadDocuments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const idToken = await getIdTokenSafely();
      if (!idToken) {
        throw new Error("Unable to authenticate. Please sign in again.");
      }

      const userDocs = await fetchDocuments(idToken);
      setDocuments(userDocs || []);
    } catch (err: any) {
      setError(err.message || "Failed to load documents. Please try again.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDocuments();
  }, [user, loadDocuments, refreshTrigger]);

  // Auto-process document when viewing
  useEffect(() => {
    if (viewMode === 'view' && viewDialogOpen && isProcessing && !decryptedUrl) {
      handleProcessDocument();
    }
  }, [viewMode, viewDialogOpen, isProcessing, decryptedUrl]);

  const handleDeleteClick = (docId: string) => {
    setSelectedDocId(docId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDocId) return;

    try {
      setIsDeleting(true);
      const idToken = await getIdTokenSafely();
      if (!idToken) {
        throw new Error("Unable to authenticate.");
      }

      await deleteDocument(selectedDocId, idToken);
      toast({ 
        title: "Deleted", 
        description: "Document has been removed." 
      });
      
      setDocuments(documents.filter(doc => doc.id !== selectedDocId));
      setDeleteDialogOpen(false);
      setSelectedDocId(null);
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Failed to delete", 
        description: err.message || "Could not delete document." 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto-process document when view dialog opens in 'view' mode
  useEffect(() => {
    if (viewDialogOpen && viewMode === 'view' && selectedDocId && !decryptedUrl) {
      handleProcessDocument();
    }
  }, [viewDialogOpen, viewMode, selectedDocId]);

  const handleViewClick = (docId: string) => {
    if (!isDocumentsUnlocked) {
      toast({
        variant: 'destructive',
        title: 'Locked',
        description: 'Please unlock the Documents section first.',
      });
      return;
    }

    const doc = documents.find(d => d.id === docId);
    if (doc) {
      setSelectedDocId(docId);
      setViewMode('view');
      setIsProcessing(true);
      setDecryptedUrl(null);
      setViewDialogOpen(true);
    }
  };

  const handleDownloadClick = (docId: string) => {
    if (!isDocumentsUnlocked) {
      toast({
        variant: 'destructive',
        title: 'Locked',
        description: 'Please unlock the Documents section first.',
      });
      return;
    }

    const doc = documents.find(d => d.id === docId);
    if (doc) {
      setSelectedDocId(docId);
      setViewMode('download');
      setIsProcessing(false);
      setDecryptedUrl(null);
      setViewDialogOpen(true);
    }
  };

  const handleShareClick = (docId: string) => {
    if (!isDocumentsUnlocked) {
      toast({
        variant: 'destructive',
        title: 'Locked',
        description: 'Please unlock the Documents section first.',
      });
      return;
    }

    const doc = documents.find(d => d.id === docId);
    if (doc) {
      setSelectedDocId(docId);
      setViewMode('share');
      setIsProcessing(false);
      setDecryptedUrl(null);
      setViewDialogOpen(true);
    }
  };

  const handleEditClick = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
      setSelectedDocId(docId);
      setEditNotes(doc.notes || "");
      setEditLabel(doc.customLabel || "");
      setEditExpiryDate(doc.expiryDate ? format(new Date(doc.expiryDate), "yyyy-MM-dd") : "");
      setEditDialogOpen(true);
    }
  };

  const handleProcessDocument = async () => {
    if (!selectedDocId) return;

    try {
      setIsProcessing(true);
      const doc = documents.find(d => d.id === selectedDocId);
      if (!doc) throw new Error("Document not found");

      if (!doc.encryptedFileData || doc.encryptedFileData.length === 0) {
        throw new Error("Document data is empty or missing");
      }

      let binaryString: string;
      try {
        binaryString = atob(doc.encryptedFileData.trim());
      } catch (decodeErr) {
        throw new Error("Invalid base64 data - file may be corrupted");
      }

      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
        
      if (doc.mimeType === 'application/pdf' || doc.fileName.endsWith('.pdf')) {
        const pdfSignature = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
        if (pdfSignature !== '%PDF') {
          // Let PDF.js try to handle it
        }
      }
        
      const mimeType = doc.mimeType || 'application/octet-stream';
      const blob = new Blob([bytes], { type: mimeType });
        
      if (blob.size === 0) {
        throw new Error("Created blob is empty - data may be corrupted");
      }
        
      const url = URL.createObjectURL(blob);
      setDecryptedUrl(url);

      if (viewMode === 'download') {
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        toast({
          title: "Success",
          description: "Document downloaded successfully."
        });
        setViewDialogOpen(false);
      } else if (viewMode === 'share') {
        const shareLink = `${window.location.origin}/share/${selectedDocId}`;
        
        try {
          await navigator.clipboard.writeText(shareLink);
          toast({
            title: "Copied",
            description: "Share link copied to clipboard."
          });
        } catch {
          toast({
            title: "Share Link",
            description: shareLink
          });
        }
        setViewDialogOpen(false);
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to process",
        description: err.message || "Could not process document."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!selectedDocId) return;

    try {
      setIsEditing(true);
      const idToken = await getIdTokenSafely();
      if (!idToken) throw new Error("Unable to authenticate.");

      // Update the document in state
      setDocuments(documents.map(doc => 
        doc.id === selectedDocId 
          ? { 
              ...doc, 
              notes: editNotes, 
              customLabel: editLabel,
              expiryDate: editExpiryDate ? editExpiryDate : null
            }
          : doc
      ));

      toast({
        title: "Success",
        description: "Document metadata updated."
      });
      setEditDialogOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to update",
        description: err.message || "Could not update metadata."
      });
    } finally {
      setIsEditing(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
            <Card key={i}>
                <CardHeader>
                    <Skeleton className="h-24 w-full" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardContent>
                 <CardFooter className="flex justify-between">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8" />
                </CardFooter>
            </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Documents Found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload your first document to see it here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <Card key={doc.id} className="flex flex-col">
            <CardHeader>
              <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="h-12 w-12 text-white opacity-50" />
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardTitle className="text-base font-semibold">{doc.customLabel || doc.name}</CardTitle>
              <CardDescription className="mt-2">
                <span className="capitalize">{doc.docType.replace('_', ' ')}</span> • {formatFileSize(doc.size)}
              </CardDescription>
              {doc.expiryDate && (
                <CardDescription className="mt-1 text-xs text-orange-600">
                  Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                </CardDescription>
              )}
              {doc.notes && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{doc.notes}</p>
              )}
              <CardDescription className="mt-2 text-xs">
                Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
              </CardDescription>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Encrypted</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewClick(doc.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    <span>View</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadClick(doc.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Download</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEditClick(doc.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit metadata</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareClick(doc.id)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleDeleteClick(doc.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your encrypted document will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View/Download/Share Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {viewMode === 'view' ? 'View Document' : viewMode === 'download' ? 'Download Document' : 'Share Document'}
            </DialogTitle>
            <DialogDescription>
              {viewMode === 'view' && 'Document preview'}
              {viewMode === 'download' && 'Click to download your encrypted document'}
              {viewMode === 'share' && 'Share document details'}
            </DialogDescription>
          </DialogHeader>
          
          {viewMode === 'view' && (
            <div className="w-full bg-gray-100 rounded-lg border border-gray-200">
              {isProcessing ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Loading document...</p>
                  </div>
                </div>
              ) : decryptedUrl ? (
                // Determine file type from both mimeType and fileName
                (() => {
                  const doc = documents.find(d => d.id === selectedDocId);
                  const isPDF = doc?.mimeType === 'application/pdf' || doc?.fileName?.toLowerCase().endsWith('.pdf');
                  const isImage = doc?.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(doc?.fileName || '');
                  
                  if (isPDF && !isImage) {
                    return (
                      <PDFViewer 
                        pdfUrl={decryptedUrl}
                        fileName={doc?.fileName || 'document.pdf'}
                        onDownload={() => {
                          const link = document.createElement('a');
                          link.href = decryptedUrl;
                          link.download = doc?.fileName || 'document.pdf';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast({
                            title: "Success",
                            description: "Document downloaded successfully."
                          });
                        }}
                      />
                    );
                  } else if (isImage) {
                    return (
                      <div className="flex items-center justify-center p-4" style={{ maxHeight: '600px' }}>
                        <img 
                          src={decryptedUrl} 
                          alt="Document preview" 
                          className="max-h-full max-w-full object-contain rounded"
                          onError={() => {
                            toast({
                              variant: "destructive",
                              title: "Image Load Error",
                              description: "Could not display the image."
                            });
                          }}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div className="h-96 flex items-center justify-center">
                        <div className="text-center space-y-3">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-600 font-medium">
                            {doc?.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            This file type cannot be previewed
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = decryptedUrl;
                              link.download = doc?.fileName || 'document';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            Download to View
                          </Button>
                        </div>
                      </div>
                    );
                  }
                })()
              ) : null}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              {viewMode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {viewMode !== 'view' && (
              <Button 
                onClick={handleProcessDocument}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : (viewMode === 'download' ? 'Download' : 'Share')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Metadata Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document Metadata</DialogTitle>
            <DialogDescription>
              Update the label, notes, and expiry date for this document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Custom Label</label>
              <Input 
                type="text"
                placeholder="e.g., My Aadhar"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Expiry Date (Optional)</label>
              <Input 
                type="date"
                value={editExpiryDate}
                onChange={(e) => setEditExpiryDate(e.target.value)}
              />
              {editExpiryDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {format(new Date(editExpiryDate), "dd/MM/yyyy")}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Add any notes about this document..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveMetadata}
              disabled={isEditing}
            >
              {isEditing ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
