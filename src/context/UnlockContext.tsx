'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface UnlockContextType {
  // Password setup
  documentsPassword: string | null;
  vaultPassword: string | null;
  setDocumentsPassword: (password: string) => void;
  setVaultPassword: (password: string) => void;
  
  // Unlock state
  isDocumentsUnlocked: boolean;
  isVaultUnlocked: boolean;
  unlockDocuments: (password: string) => boolean;
  unlockVault: (password: string) => boolean;
  lockDocuments: () => void;
  lockVault: () => void;
  lockAll: () => void;
  
  // First time setup
  isFirstTimeSetup: boolean;
  completeFirstTimeSetup: () => void;
  
  // Clear encryption keys (for new accounts or logout)
  clearEncryptionKeys: () => void;
}

const UnlockContext = createContext<UnlockContextType | undefined>(undefined);
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function UnlockProvider({ children }: { children: React.ReactNode }) {
  const [documentsPassword, setDocumentsPassword] = useState<string | null>(null);
  const [vaultPassword, setVaultPassword] = useState<string | null>(null);
  const [isDocumentsUnlocked, setIsDocumentsUnlocked] = useState(false);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load passwords from localStorage on mount
  useEffect(() => {
    const savedDocsPassword = localStorage.getItem('familysafe_docs_password');
    const savedVaultPassword = localStorage.getItem('familysafe_vault_password');
    
    if (savedDocsPassword) setDocumentsPassword(savedDocsPassword);
    if (savedVaultPassword) setVaultPassword(savedVaultPassword);
    
    // If both passwords are set, not first time
    if (savedDocsPassword && savedVaultPassword) {
      setIsFirstTimeSetup(false);
    }
  }, []);

  // Auto-lock when page visibility changes (tab hidden/visible, screen lock)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, lock everything
        setIsDocumentsUnlocked(false);
        setIsVaultUnlocked(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleSetDocumentsPassword = useCallback((password: string) => {
    setDocumentsPassword(password);
    localStorage.setItem('familysafe_docs_password', password);
  }, []);

  const handleSetVaultPassword = useCallback((password: string) => {
    setVaultPassword(password);
    localStorage.setItem('familysafe_vault_password', password);
  }, []);

  const unlockDocuments = useCallback((password: string): boolean => {
    if (documentsPassword && password === documentsPassword) {
      setIsDocumentsUnlocked(true);
      return true;
    }
    return false;
  }, [documentsPassword]);

  const unlockVault = useCallback((password: string): boolean => {
    if (vaultPassword && password === vaultPassword) {
      setIsVaultUnlocked(true);
      return true;
    }
    return false;
  }, [vaultPassword]);

  const lockDocuments = useCallback(() => {
    setIsDocumentsUnlocked(false);
  }, []);

  const lockVault = useCallback(() => {
    setIsVaultUnlocked(false);
  }, []);

  const lockAll = useCallback(() => {
    setIsDocumentsUnlocked(false);
    setIsVaultUnlocked(false);
  }, []);

  const completeFirstTimeSetup = useCallback(() => {
    setIsFirstTimeSetup(false);
  }, []);

  const clearEncryptionKeys = useCallback(() => {
    // Clear state
    setDocumentsPassword(null);
    setVaultPassword(null);
    setIsDocumentsUnlocked(false);
    setIsVaultUnlocked(false);
    setIsFirstTimeSetup(true);
    
    // Clear localStorage
    localStorage.removeItem('familysafe_docs_password');
    localStorage.removeItem('familysafe_vault_password');
    
    // Clear any session timeout
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
  }, [sessionTimeout]);

  return (
    <UnlockContext.Provider
      value={{
        documentsPassword,
        vaultPassword,
        setDocumentsPassword: handleSetDocumentsPassword,
        setVaultPassword: handleSetVaultPassword,
        isDocumentsUnlocked,
        isVaultUnlocked,
        unlockDocuments,
        unlockVault,
        lockDocuments,
        lockVault,
        lockAll,
        isFirstTimeSetup,
        completeFirstTimeSetup,
        clearEncryptionKeys,
      }}
    >
      {children}
    </UnlockContext.Provider>
  );
}

export function useUnlock() {
  const context = useContext(UnlockContext);
  if (context === undefined) {
    throw new Error('useUnlock must be used within UnlockProvider');
  }
  return context;
}
