'use client';

import { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useUnlock } from '@/context/UnlockContext';
import { useAuth } from '@/hooks/useAuth';
import { getIdTokenSafely } from '@/lib/firebase/get-id-token';
import {
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPasswords,
} from '@/app/actions/password-reset-actions';

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ResetStep = 'otp' | 'new-passwords' | 'success';

export default function PasswordResetDialog({
  open,
  onOpenChange,
}: PasswordResetDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { setDocumentsPassword, setVaultPassword, completeFirstTimeSetup } = useUnlock();

  const [step, setStep] = useState<ResetStep>('otp');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newDocumentsPassword, setNewDocumentsPassword] = useState('');
  const [newVaultPassword, setNewVaultPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Auto-fetch email when dialog opens
  useEffect(() => {
    if (open && user?.email) {
      setEmail(user.email);
      // Automatically send OTP when dialog opens
      handleSendOTP(user.email);
    }
  }, [open, user]);

  const handleSendOTP = async (emailToUse?: string) => {
    const emailAddress = emailToUse || email;
    
    if (!emailAddress.trim()) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Unable to fetch your email. Please try logging in again.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const idToken = await getIdTokenSafely();
      if (!idToken) {
        throw new Error('Unable to authenticate');
      }

      await sendPasswordResetOTP(emailAddress, idToken);
      toast({
        title: 'OTP Sent',
        description: 'Check your email for the OTP code (6 digits). Expires in 10 minutes.',
      });
      setStep('otp');
      setAttemptCount(0);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send OTP',
        description: error.message || 'Could not send OTP. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit OTP.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const idToken = await getIdTokenSafely();
      if (!idToken) {
        throw new Error('Unable to authenticate');
      }

      const result = await verifyPasswordResetOTP(email, otp, idToken);
      setResetToken(result.resetToken);
      toast({
        title: 'OTP Verified',
        description: 'Now set your new passwords.',
      });
      setStep('new-passwords');
      setAttemptCount(0);
    } catch (error: any) {
      setAttemptCount((prev) => prev + 1);
      toast({
        variant: 'destructive',
        title: 'Invalid OTP',
        description: error.message || 'The OTP you entered is incorrect.',
      });

      if (attemptCount >= 2) {
        toast({
          variant: 'destructive',
          title: 'Too Many Failed Attempts',
          description: 'Please start over and request a new OTP.',
        });
        handleReset();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswords = async () => {
    if (newDocumentsPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Too Short',
        description: 'Documents password must be at least 6 characters.',
      });
      return;
    }

    if (newVaultPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Too Short',
        description: 'Vault password must be at least 6 characters.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const idToken = await getIdTokenSafely();
      if (!idToken) {
        throw new Error('Unable to authenticate');
      }

      await resetPasswords(
        email,
        resetToken,
        newDocumentsPassword,
        newVaultPassword,
        idToken
      );

      // Update local passwords
      setDocumentsPassword(newDocumentsPassword);
      setVaultPassword(newVaultPassword);

      toast({
        title: 'Passwords Reset',
        description: 'Your passwords have been updated successfully.',
      });

      setStep('success');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Reset',
        description: error.message || 'Could not reset passwords.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('otp');
    setOtp('');
    setResetToken('');
    setNewDocumentsPassword('');
    setNewVaultPassword('');
    setAttemptCount(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'otp' && 'Reset Your Passwords'}
            {step === 'new-passwords' && 'Set New Passwords'}
            {step === 'success' && 'Passwords Reset Successfully'}
          </DialogTitle>
          <DialogDescription>
            {step === 'otp' && `Enter the 6-digit OTP sent to ${email}`}
            {step === 'new-passwords' && 'Set new passwords for Documents and Secure Vault'}
            {step === 'success' && 'Your passwords have been updated'}
          </DialogDescription>
        </DialogHeader>

        {step === 'otp' && (
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                OTP sent to: <strong>{email}</strong><br />
                Check your inbox (and spam folder). Code expires in 10 minutes.
              </AlertDescription>
            </Alert>

            <div>
              <label className="text-sm font-medium">OTP Code</label>
              <Input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                disabled={isLoading}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            {attemptCount > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {3 - attemptCount} attempt{3 - attemptCount !== 1 ? 's' : ''} remaining
                </AlertDescription>
              </Alert>
            )}

            <Button
              variant="link"
              onClick={() => handleSendOTP()}
              disabled={isLoading}
              className="w-full"
            >
              Didn't receive code? Resend OTP
            </Button>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleVerifyOTP} disabled={isLoading || otp.length !== 6}>
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'new-passwords' && (
          <div className="space-y-4">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                You're setting separate passwords for two secure sections:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Documents:</strong> For accessing your encrypted documents</li>
                  <li><strong>Secure Vault:</strong> For accessing your password vault</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div>
              <label className="text-sm font-medium">Reset Password for Documents</label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={newDocumentsPassword}
                onChange={(e) => setNewDocumentsPassword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This password unlocks your encrypted documents section
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Reset Password for Secure Vault</label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={newVaultPassword}
                onChange={(e) => setNewVaultPassword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This password unlocks your secure password vault
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure you remember these passwords. You'll need them to unlock your Documents and Vault sections.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('otp')}>
                Back
              </Button>
              <Button
                onClick={handleResetPasswords}
                disabled={
                  isLoading ||
                  newDocumentsPassword.length < 6 ||
                  newVaultPassword.length < 6
                }
              >
                {isLoading ? 'Resetting...' : 'Reset Passwords'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your passwords have been successfully reset!
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <p>
                <strong>Next steps:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Sign in with your new passwords</li>
                <li>Unlock Documents section with your new password</li>
                <li>Unlock Vault section with your new password</li>
              </ul>
            </div>

            <DialogFooter>
              <Button onClick={handleReset} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
