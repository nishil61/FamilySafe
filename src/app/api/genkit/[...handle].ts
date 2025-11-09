
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import startServer from '@genkit-ai/next';
import { registerUserFlow } from '@/ai/flows/register-user';
import { NextRequest, NextResponse } from 'next/server';
import { handleCORS, applyCORSHeaders } from '@/lib/cors';

// This is the primary Genkit configuration for your Next.js app.
// It is used by the API route to handle flow requests.
// Note: Debug logging is still available via process.env NODE_ENV
const isDevelopment = process.env.NODE_ENV === 'development';

genkit({
    plugins: [
        googleAI(),
    ],
});

// Register the flow with Genkit
registerUserFlow;

// The startServer function creates the Next.js API route handler.
// Added authentication and CORS checks via middleware wrapper below
const genkitHandler = startServer as any;

// Middleware to add authentication checks and CORS
async function authenticatedGenkitHandler(request: NextRequest) {
  // Check CORS first
  const corsError = handleCORS(request);
  if (corsError) return corsError;

  // Check for authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return applyCORSHeaders(
      NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 }
      ),
      request
    );
  }

  // Process request through genkit
  const response = await genkitHandler(request);
  return applyCORSHeaders(response as NextResponse, request);
}

export const GET = authenticatedGenkitHandler;
export const POST = authenticatedGenkitHandler;
