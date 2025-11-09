'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PDFViewer from '@/components/dashboard/PDFViewer';
import { formatFileSize } from '@/lib/utils';

interface SharePageProps {
  params: Promise<{ docId: string }>;
}

export default function SharePage({ params: paramsPromise }: SharePageProps) {
  const params = use(paramsPromise);
  const { docId } = params;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) return;
    
    if (!user) {
      // Redirect to login if not authenticated
      router.push(`/?redirect=/share/${docId}`);
      return;
    }

    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch the document from Firestore via an API endpoint
        const response = await fetch(`/api/share/${docId}`, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Document not found');
          } else if (response.status === 403) {
            throw new Error('Access denied to this document');
          }
          throw new Error('Failed to fetch document');
        }

        const docData = await response.json();
        setDocument(docData);

        // Decode the file data
        const binaryString = atob(docData.encryptedFileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const mimeType = docData.mimeType || 'application/octet-stream';
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        setFileUrl(url);
      } catch (err: any) {
        setError(err.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [user, docId, router, authLoading]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="animate-spin">
              <Lock className="w-8 h-8 mx-auto text-blue-600" />
            </div>
            <CardTitle>Checking Authentication...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <LogIn className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>Please sign in to view this document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push(`/?redirect=/share/${docId}`)}
              className="w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="animate-spin">
              <Lock className="w-8 h-8 mx-auto text-blue-600" />
            </div>
            <CardTitle>Loading Document</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <CardTitle>Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Document Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDownload = () => {
    if (!fileUrl || !document) return;
    
    // Use window.document to avoid conflict with the 'document' variable
    const link = window.document.createElement('a');
    link.href = fileUrl;
    link.download = document.fileName || 'download';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Shared Document
            </CardTitle>
            <CardDescription>
              {document.name || document.fileName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Preview */}
            <div className="bg-gray-100 rounded-lg border border-gray-200 overflow-auto">
              {fileUrl ? (
                (() => {
                  const isPDF = document.mimeType === 'application/pdf' || document.fileName?.toLowerCase().endsWith('.pdf');
                  const isImage = document.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(document.fileName || '');
                  
                  if (isPDF && !isImage) {
                    return (
                      <PDFViewer 
                        pdfUrl={fileUrl}
                        fileName={document.fileName}
                        onDownload={handleDownload}
                      />
                    );
                  } else if (isImage) {
                    return (
                      <div className="flex items-center justify-center p-4" style={{ maxHeight: '600px' }}>
                        <img 
                          src={fileUrl} 
                          alt={document.fileName}
                          className="max-h-full max-w-full object-contain rounded"
                        />
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-8 text-center">
                        <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                        <Button onClick={handleDownload}>
                          <Download className="w-4 h-4 mr-2" />
                          Download File
                        </Button>
                      </div>
                    );
                  }
                })()
              ) : null}
            </div>

            {/* Document Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">File Name</p>
                <p className="font-medium">{document.fileName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">File Size</p>
                <p className="font-medium">{formatFileSize(document.size)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Document Type</p>
                <p className="font-medium capitalize">{document.docType?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Uploaded</p>
                <p className="font-medium">
                  {document.uploadedAt ? (
                    typeof document.uploadedAt === 'object' && document.uploadedAt._seconds
                      ? new Date(document.uploadedAt._seconds * 1000).toLocaleDateString()
                      : new Date(document.uploadedAt).toLocaleDateString()
                  ) : 'Unknown'}
                </p>
              </div>
            </div>

            {document.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Notes</p>
                <p className="text-gray-800">{document.notes}</p>
              </div>
            )}

            {/* Download Button */}
            <Button 
              onClick={handleDownload}
              className="w-full"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Document
            </Button>

            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
