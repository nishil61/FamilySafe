"use client";

import React from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SecureVault from './SecureVault';
import { useUnlock } from '@/context/UnlockContext';

// This is a wrapper component for the Secure Vault that handles unlock state
export default function VaultWrapper() {
  const { isVaultUnlocked } = useUnlock();

  if (!isVaultUnlocked) {
    // Vault is already locked - the unlock dialog is handled in dashboard/page.tsx
    // This should not be rendered when locked
    return null;
  }

  return <SecureVault />;
}
