'use client';

import { useState, useEffect } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
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

interface UnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: 'documents' | 'vault';
  onForgotPassword?: () => void;
}

const LOCK_STORAGE_KEY = (section: string) => `unlock_lock_${section}`;
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

export default function UnlockDialog({ open, onOpenChange, section, onForgotPassword }: UnlockDialogProps) {
  const { toast } = useToast();
  const { unlockDocuments, unlockVault } = useUnlock();
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');

  // Check if previously locked
  useEffect(() => {
    const storedLockout = localStorage.getItem(LOCK_STORAGE_KEY(section));
    if (storedLockout) {
      const lockoutEnd = parseInt(storedLockout);
      const now = Date.now();
      if (now < lockoutEnd) {
        setLockoutTime(lockoutEnd);
      } else {
        localStorage.removeItem(LOCK_STORAGE_KEY(section));
      }
    }
  }, [section]);

  // Update remaining time every second
  useEffect(() => {
    if (!lockoutTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = lockoutTime - now;

      if (remaining <= 0) {
        setLockoutTime(null);
        setAttempts(0);
        setRemainingTime('');
        localStorage.removeItem(LOCK_STORAGE_KEY(section));
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutTime, section]);

  const handleUnlock = async () => {
    if (!password) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter your password',
      });
      return;
    }

    setIsUnlocking(true);
    try {
      const success =
        section === 'documents'
          ? unlockDocuments(password)
          : unlockVault(password);

      if (success) {
        toast({
          title: 'Unlocked',
          description: `${section === 'documents' ? 'My Documents' : 'Secure Vault'} section is now unlocked.`,
        });
        setPassword('');
        setAttempts(0);
        setLockoutTime(null);
        localStorage.removeItem(LOCK_STORAGE_KEY(section));
        onOpenChange(false);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          // Lock for 2 hours
          const lockoutEnd = Date.now() + LOCKOUT_DURATION;
          setLockoutTime(lockoutEnd);
          localStorage.setItem(LOCK_STORAGE_KEY(section), lockoutEnd.toString());
          
          toast({
            variant: 'destructive',
            title: 'Account Locked',
            description: 'Too many failed attempts. Your account has been locked for 2 hours.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Invalid Password',
            description: `Incorrect password. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`,
          });
        }
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const isLocked = lockoutTime !== null && Date.now() < lockoutTime;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Unlock {section === 'documents' ? 'My Documents' : 'Secure Vault'}
          </DialogTitle>
          <DialogDescription>
            Enter your {section === 'documents' ? 'documents' : 'vault'} password to access this section.
          </DialogDescription>
        </DialogHeader>

        {isLocked && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Too many failed attempts. Your account is locked for security.</p>
                <p className="font-semibold">Time remaining: {remainingTime}</p>
                <p className="text-xs">Or reset your password via email verification.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!isLocked && attempts > 0 && attempts < MAX_ATTEMPTS && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining before lockout.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isUnlocking && !isLocked) {
                handleUnlock();
              }
            }}
            disabled={isLocked || isUnlocking}
          />
          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
            >
              Forgot password?
            </button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUnlock} disabled={isUnlocking || isLocked || !password}>
            {isUnlocking ? 'Unlocking...' : 'Unlock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
