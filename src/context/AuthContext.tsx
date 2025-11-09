
"use client";

import React, { createContext, useState, useEffect } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  login as firebaseLogin,
  sendPasswordReset as firebaseSendPasswordReset,
  reauthenticateAndChangePassword as firebaseReauthenticateAndChangePassword,
  verifyEmail as firebaseVerifyEmail,
  sendVerificationEmail as firebaseSendVerificationEmail
} from "@/lib/firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isVerified: boolean;
  login: typeof firebaseLogin;
  logout: () => Promise<void>;
  sendPasswordReset: typeof firebaseSendPasswordReset;
  reauthenticateAndChangePassword: typeof firebaseReauthenticateAndChangePassword;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  sendVerificationEmail: typeof firebaseSendVerificationEmail;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Simple, non-blocking auth state listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const verifyEmail = async (email: string, otp: string) => {
    await firebaseVerifyEmail(email, otp);
    setIsVerified(true);
  };

  const logout = async () => {
    // Clear encryption keys from localStorage on logout for security
    localStorage.removeItem('familysafe_docs_password');
    localStorage.removeItem('familysafe_vault_password');
    
    await signOut(auth);
  };

  const value: AuthContextType = {
    user,
    loading,
    isVerified,
    login: firebaseLogin,
    logout,
    sendPasswordReset: firebaseSendPasswordReset,
    reauthenticateAndChangePassword: firebaseReauthenticateAndChangePassword,
    verifyEmail,
    sendVerificationEmail: firebaseSendVerificationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
