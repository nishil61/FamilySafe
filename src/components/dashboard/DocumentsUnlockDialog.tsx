'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
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

interface DocumentsUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DocumentsUnlockDialog({ open, onOpenChange }: DocumentsUnlockDialogProps) {
  const { toast } = useToast();
  const { unlockDocuments } = useUnlock();
  const [passphrase, setPassphrase] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async () => {
    if (!passphrase) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a passphrase',
      });
      return;
    }

    try {
      setIsUnlocking(true);
      const success = await unlockDocuments(passphrase);

      if (success) {
        toast({
          title: 'Unlocked',
          description: 'My Documents section is now unlocked.',
        });
        setPassphrase('');
        onOpenChange(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid Passphrase',
          description: 'The passphrase you entered is incorrect.',
        });
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Unlock Documents
          </DialogTitle>
          <DialogDescription>
            Enter your central passphrase to access your documents.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Enter central passphrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isUnlocking) {
                handleUnlock();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUnlock} disabled={isUnlocking}>
            {isUnlocking ? 'Unlocking...' : 'Unlock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
