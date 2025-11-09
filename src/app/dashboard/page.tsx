"use client";

import { useState } from "react";
import { FileText, Lock, UploadCloud, LockOpen } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import DocumentUpload from "@/components/dashboard/DocumentUpload";
import DocumentList from "@/components/dashboard/DocumentList";
import UnlockDialog from "@/components/dashboard/UnlockDialog";
import FirstTimeSetupDialog from "@/components/dashboard/FirstTimeSetupDialog";
import PasswordResetDialog from "@/components/dashboard/PasswordResetDialog";
import VaultWrapper from "@/components/dashboard/Vault";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useUnlock } from "@/context/UnlockContext";

export default function DashboardPage() {
  const [refreshDocuments, setRefreshDocuments] = useState(0);
  const [documentsUnlockOpen, setDocumentsUnlockOpen] = useState(false);
  const [vaultUnlockOpen, setVaultUnlockOpen] = useState(false);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("documents");
  const { isDocumentsUnlocked, isVaultUnlocked, lockDocuments, lockVault, lockAll, isFirstTimeSetup } = useUnlock();

  const handleDocumentUploaded = () => {
    // Trigger a refresh of the document list
    setRefreshDocuments(prev => prev + 1);
  };

  const handleTabChange = (tabValue: string) => {
    // Non-blocking tab switch
    setCurrentTab(tabValue);
    // Lock sections after tab change to avoid UI jank
    queueMicrotask(() => lockAll());
  };

  return (
    <DashboardLayout>
      {/* Show first-time setup dialog if user hasn't set up passwords */}
      <FirstTimeSetupDialog open={isFirstTimeSetup} />

      <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                Upload New Document
              </CardTitle>
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="documents">
                    <FileText className="mr-2 h-4 w-4" />
                    My Documents
                  </TabsTrigger>
                  <TabsTrigger value="vault">
                    <Lock className="mr-2 h-4 w-4" />
                    Secure Vault
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="documents" className="space-y-4">
                {!isDocumentsUnlocked ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                    <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Documents Locked</h3>
                    <p className="mt-2 text-sm text-muted-foreground mb-4">
                      Please unlock to access your documents.
                    </p>
                    <Button onClick={() => setDocumentsUnlockOpen(true)}>
                      <LockOpen className="mr-2 h-4 w-4" />
                      Unlock Documents
                    </Button>
                  </div>
                ) : (
                  <DocumentList refreshTrigger={refreshDocuments} />
                )}
              </TabsContent>
              <TabsContent value="vault" className="space-y-4">
                {!isVaultUnlocked ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                    <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Vault Locked</h3>
                    <p className="mt-2 text-sm text-muted-foreground mb-4">
                      Please unlock to access your secure vault.
                    </p>
                    <Button onClick={() => setVaultUnlockOpen(true)}>
                      <LockOpen className="mr-2 h-4 w-4" />
                      Unlock Vault
                    </Button>
                  </div>
                ) : (
                  <VaultWrapper />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Unlock dialogs for both sections */}
      <UnlockDialog 
        open={documentsUnlockOpen} 
        onOpenChange={setDocumentsUnlockOpen}
        section="documents"
        onForgotPassword={() => {
          setDocumentsUnlockOpen(false);
          setPasswordResetOpen(true);
        }}
      />
      <UnlockDialog 
        open={vaultUnlockOpen} 
        onOpenChange={setVaultUnlockOpen}
        section="vault"
        onForgotPassword={() => {
          setVaultUnlockOpen(false);
          setPasswordResetOpen(true);
        }}
      />

      {/* Password Reset Dialog */}
      <PasswordResetDialog
        open={passwordResetOpen}
        onOpenChange={setPasswordResetOpen}
      />
    </DashboardLayout>
  );
}
