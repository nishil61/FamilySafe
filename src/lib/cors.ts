/**
 * CORS Utility for Next.js API Routes
 * Ensures API access is restricted to authorized origins
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  // Development
  'http://localhost:9002',
  'http://localhost:3000',
  // Production - Vercel domains
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002',
  'https://familysafe-git-main-nishil61s-projects.vercel.app',
  'https://familysafe-nishil61.vercel.app',
  // Allow all *.vercel.app domains in production
  ...(process.env.NODE_ENV === 'production' ? ['https://*.vercel.app'] : []),
];

const isDevelopment = process.env.NODE_ENV === 'development';

export function getCORSHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

export function handleCORS(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: getCORSHeaders(request),
    });
  }

  // Validate origin for non-preflight requests
  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.includes(origin) && !isDevelopment) {
    return new NextResponse(
      JSON.stringify({ error: 'CORS policy violation' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return null; // Continue processing
}

export function applyCORSHeaders(response: NextResponse, request: NextRequest) {
  const corsHeaders = getCORSHeaders(request);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
