'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUnlock } from '@/context/UnlockContext';

interface FirstTimeSetupDialogProps {
  open: boolean;
}

export default function FirstTimeSetupDialog({ open }: FirstTimeSetupDialogProps) {
  const { toast } = useToast();
  const { setDocumentsPassword, setVaultPassword, completeFirstTimeSetup } = useUnlock();
  const [step, setStep] = useState<'documents' | 'vault' | 'confirm'>('documents');
  const [documentsPass, setDocumentsPass] = useState('');
  const [vaultPass, setVaultPass] = useState('');
  const [showDocumentsPass, setShowDocumentsPass] = useState(false);
  const [showVaultPass, setShowVaultPass] = useState(false);
  const [showConfirmDocuments, setShowConfirmDocuments] = useState(false);
  const [showConfirmVault, setShowConfirmVault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDocumentsNext = () => {
    if (documentsPass.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Too short',
        description: 'Password must be at least 6 characters',
      });
      return;
    }
    setStep('vault');
  };

  const handleVaultNext = () => {
    if (vaultPass.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Too short',
        description: 'Password must be at least 6 characters',
      });
      return;
    }
    setStep('confirm');
  };

  const handleConfirm = () => {
    setIsLoading(true);
    try {
      setDocumentsPassword(documentsPass);
      setVaultPassword(vaultPass);
      completeFirstTimeSetup();
      
      toast({
        title: 'Passwords Set',
        description: 'Your security passwords have been configured.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'vault') setStep('documents');
    else if (step === 'confirm') setStep('vault');
  };

  return (
    <Dialog open={open} modal={true}>
    <DialogContent className="max-w-md" onInteractOutside={(e: Event) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle>Set Up Your Security Passwords</DialogTitle>
        <DialogDescription>
        {step === 'documents' && 'Create a password to access your documents.'}
        {step === 'vault' && 'Create a separate password to access your secure vault.'}
        {step === 'confirm' && 'Review your passwords before confirming.'}
        </DialogDescription>
      </DialogHeader>

      {step === 'documents' && (
        <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Documents Password</label>
          <div className="relative">
            <Input
              type={showDocumentsPass ? "text" : "password"}
              placeholder="Enter documents password"
              value={documentsPass}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocumentsPass(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') handleDocumentsNext();
              }}
            />
            <button
              type="button"
              onClick={() => setShowDocumentsPass(!showDocumentsPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showDocumentsPass ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Minimum 6 characters. You'll need this to view your documents.
          </p>
        </div>
        </div>
      )}

      {step === 'vault' && (
        <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Vault Password</label>
          <div className="relative">
            <Input
              type={showVaultPass ? "text" : "password"}
              placeholder="Enter vault password"
              value={vaultPass}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVaultPass(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') handleVaultNext();
              }}
            />
            <button
              type="button"
              onClick={() => setShowVaultPass(!showVaultPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showVaultPass ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Minimum 6 characters. A separate password for sensitive documents.
          </p>
        </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Documents Password</p>
            <div className="flex items-center justify-between bg-white p-3 rounded border">
              <p className={`${showConfirmDocuments ? 'font-mono' : 'tracking-widest'}`}>
                {showConfirmDocuments ? documentsPass : '•'.repeat(Math.max(documentsPass.length, 1))}
              </p>
              <button
                type="button"
                onClick={() => setShowConfirmDocuments(!showConfirmDocuments)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showConfirmDocuments ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Vault Password</p>
            <div className="flex items-center justify-between bg-white p-3 rounded border">
              <p className={`${showConfirmVault ? 'font-mono' : 'tracking-widest'}`}>
                {showConfirmVault ? vaultPass : '•'.repeat(Math.max(vaultPass.length, 1))}
              </p>
              <button
                type="button"
                onClick={() => setShowConfirmVault(!showConfirmVault)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showConfirmVault ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Make sure you remember both passwords. You can reset them later via OTP verification.
        </p>
        </div>
      )}

      <DialogFooter>
        {step !== 'documents' && (
        <Button variant="outline" onClick={handleBack} disabled={isLoading}>
          Back
        </Button>
        )}
        <Button
        onClick={
          step === 'documents'
            ? handleDocumentsNext
            : step === 'vault'
            ? handleVaultNext
            : handleConfirm
        }
        disabled={
          isLoading ||
          (step === 'documents' && !documentsPass) ||
          (step === 'vault' && !vaultPass)
        }
        >
        {isLoading
          ? 'Setting up...'
          : step === 'confirm'
          ? 'Confirm & Continue'
          : 'Next'}
        </Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  );
}
