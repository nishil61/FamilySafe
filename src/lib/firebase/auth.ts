
"use client";

import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "./config";
import { getFirebaseErrorMessage } from "./errors";

// This function only generates an OTP and stores it in localStorage for the client-side verification step.
const generateAndStoreOtp = async (email: string) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  const otpData = {
    otp: otp,
    email: email,
    timestamp: new Date().getTime(),
  };

  localStorage.setItem("otpData", JSON.stringify(otpData));
  
  try {
    // Send email and handle errors properly
    // Use absolute URL for production compatibility
    const apiUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/api/send-email`
      : '/api/send-email';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ to: email, otp }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to send verification email';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = `${response.status}: ${response.statusText}`;
      }
      const error: any = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to send verification email');
    }
  } catch (error: any) {
    // Clean up OTP data on error
    localStorage.removeItem("otpData");
    console.error('Email sending error:', error);
    throw error;
  }
};


// This function is responsible for initiating the OTP process on the client.
export async function sendVerificationEmail(email: string) {
    await generateAndStoreOtp(email);
}


// Custom OTP verification logic that checks against localStorage.
export async function verifyEmail(email: string, otp: string) {
    const otpDataString = localStorage.getItem("otpData");
    if (!otpDataString) {
        throw { code: 'auth/invalid-otp' };
    }

    const otpData = JSON.parse(otpDataString);
    const { otp: storedOtp, email: storedEmail, timestamp } = otpData;

    const TEN_MINUTES_IN_MS = 10 * 60 * 1000;
    if (new Date().getTime() - timestamp > TEN_MINUTES_IN_MS) {
        localStorage.removeItem("otpData");
        throw { code: 'auth/otp-expired' };
    }

    if (storedEmail !== email || storedOtp !== otp) {
        throw { code: 'auth/invalid-otp' };
    }

    // Success! Clean up the stored OTP.
    localStorage.removeItem("otpData");

    // The user object should already be in the Auth context from the initial login step.
    // By successfully verifying, we allow them to proceed.
    return Promise.resolve();
}


export async function login(email: string, password: string) {
    // This just signs the user in. OTP verification happens on the next screen.
    return await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
    return signOut(auth);
}

export async function sendPasswordReset(email: string) {
    return sendPasswordResetEmail(auth, email);
}

export async function reauthenticateAndChangePassword(currentPassword: string, newPassword: string) {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error("User not authenticated or email is missing.");
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    return updatePassword(user, newPassword);
}
