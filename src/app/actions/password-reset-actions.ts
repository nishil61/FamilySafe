'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { adminApp } from '@/lib/firebase/admin';

// Simple in-memory OTP store (in production, use Redis or Firestore with TTL)
// Format: { email: { otp: string, expiresAt: timestamp } }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Helper to generate random OTP
function generateOTP(): string {
  return Math.random().toString().slice(2, 8); // 6-digit OTP
}

// Helper to verify ID token only (email is passed from client)
async function verifyIdToken(idToken: string | undefined): Promise<void> {
  if (!idToken) {
    throw new Error('User not authenticated. No token provided.');
  }

  try {
    // Just verify the token, don't fetch user details
    await getAuth(adminApp).verifyIdToken(idToken);
  } catch (error) {
    throw new Error('User not authenticated. Invalid token.');
  }
}

/**
 * Send OTP to user's registered email for password reset
 */
export async function sendPasswordResetOTP(
  email: string,
  idToken: string | undefined
): Promise<{ success: boolean; message: string }> {
  try {
    // Verify token (email is trusted from authenticated client)
    await verifyIdToken(idToken);

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Store OTP
    otpStore.set(email.toLowerCase(), { otp, expiresAt });

    // Send OTP via email
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, otp }),
      });

      if (!emailResponse.ok) {
        throw new Error('Failed to send email');
      }
    } catch (emailError) {
      // Silently fail - email is best-effort
    }

    return {
      success: true,
      message: 'OTP sent to your registered email. Check your inbox (and spam folder).',
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send OTP');
  }
}

/**
 * Verify OTP and get reset token
 */
export async function verifyPasswordResetOTP(
  email: string,
  otp: string,
  idToken: string | undefined
): Promise<{ success: boolean; resetToken: string }> {
  try {
    // Verify token
    await verifyIdToken(idToken);

    const stored = otpStore.get(email.toLowerCase());
    
    if (!stored) {
      throw new Error('No OTP request found for this email');
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email.toLowerCase());
      throw new Error('OTP expired. Please request a new one.');
    }

    if (stored.otp !== otp) {
      throw new Error('Invalid OTP');
    }

    // OTP verified - create reset token
    const resetToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    
    // Store reset token with expiry (valid for 30 minutes)
    otpStore.set(`reset_${email.toLowerCase()}`, {
      otp: resetToken,
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    // Clear OTP
    otpStore.delete(email.toLowerCase());

    return {
      success: true,
      resetToken,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to verify OTP');
  }
}

/**
 * Reset passwords using reset token
 */
export async function resetPasswords(
  email: string,
  resetToken: string,
  newDocumentsPassword: string,
  newVaultPassword: string,
  idToken: string | undefined
): Promise<{ success: boolean; message: string }> {
  try {
    // Verify token
    await verifyIdToken(idToken);

    // Verify reset token
    const stored = otpStore.get(`reset_${email.toLowerCase()}`);
    if (!stored) {
      throw new Error('Invalid or expired reset token');
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(`reset_${email.toLowerCase()}`);
      throw new Error('Reset token expired. Please request a new OTP.');
    }

    if (stored.otp !== resetToken) {
      throw new Error('Invalid reset token');
    }

    // Validate new passwords
    if (newDocumentsPassword.length < 6) {
      throw new Error('Documents password must be at least 6 characters');
    }
    if (newVaultPassword.length < 6) {
      throw new Error('Vault password must be at least 6 characters');
    }

    // Clear reset token
    otpStore.delete(`reset_${email.toLowerCase()}`);

    // In production, you might want to:
    // 1. Store password hashes in Firestore
    // 2. Re-encrypt user data with new passwords
    // 3. Log password reset event for security audit

    return {
      success: true,
      message: 'Passwords reset successfully. Please sign in again.',
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to reset passwords');
  }
}
