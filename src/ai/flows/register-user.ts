
'use server';
/**
 * @fileOverview A server-side flow for securely registering a new user.
 * This flow is responsible only for creating the user in Firebase Authentication.
 * Email verification and OTP sending are handled on the client side.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getAuth} from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin'; // Import the centralized admin app

const auth = getAuth(adminApp);

const RegisterUserInputSchema = z.object({
  email: z.string().email().describe("The new user's email address."),
  password: z.string().min(8).describe("The new user's password."),
});

const RegisterUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  uid: z.string().optional(),
});

export type RegisterUserInput = z.infer<typeof RegisterUserInputSchema>;
export type RegisterUserOutput = z.infer<typeof RegisterUserOutputSchema>;


export const registerUserFlow = ai.defineFlow(
  {
    name: 'registerUserFlow',
    inputSchema: RegisterUserInputSchema,
    outputSchema: RegisterUserOutputSchema,
  },
  async ({email, password}) => {
    try {
      // 1. Create the user using Firebase Admin SDK
      const userRecord = await auth.createUser({
        email,
        password,
        emailVerified: false, // Mark as not verified until OTP is confirmed
      });

      // 2. Return a success response with the UID
      return {
        success: true,
        message: 'User created successfully. Please verify your email.',
        uid: userRecord.uid,
      };
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred during registration.';
      if (error.code === 'auth/email-already-exists') {
        errorMessage =
          'This email address is already in use by another account.';
      } else if (error.code === 'auth/invalid-password') {
        // This check is also done client-side, but it's good to have it here.
        errorMessage = 'The password must be at least 6 characters long.';
      }
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
);

// Export a client-callable wrapper
export async function registerUser(input: RegisterUserInput): Promise<RegisterUserOutput> {
    return registerUserFlow(input);
}
