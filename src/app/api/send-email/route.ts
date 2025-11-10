
import { NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';
import { handleCORS, applyCORSHeaders } from '@/lib/cors';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (use Redis in production)
const emailRateLimiter = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(email: string, maxRequests: number = 5, windowMs: number = 3600000): boolean {
  const now = Date.now();
  const limiter = emailRateLimiter.get(email);

  if (!limiter || now > limiter.resetTime) {
    emailRateLimiter.set(email, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (limiter.count >= maxRequests) {
    return false;
  }

  limiter.count++;
  return true;
}

export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  // Check CORS
  const corsError = handleCORS(request);
  if (corsError) return corsError;
  try {
    const { to, otp } = await request.json();

    if (!to || !otp) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: to, otp' },
        { status: 400 }
      );
    }

    // Check rate limit per email
    if (!checkRateLimit(to)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address.' },
        { status: 400 }
      );
    }

    // Validate OTP format (should be numeric, max 10 digits)
    if (!/^\d{1,10}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: 'Invalid OTP format.' },
        { status: 400 }
      );
    }

    // Sanitize OTP to prevent injection attacks
    const sanitizedOtp = otp.replace(/[^\d]/g, '');

    const user = process.env.EMAIL_SERVER_USER;
    const pass = process.env.EMAIL_SERVER_PASSWORD;
    const from = process.env.EMAIL_FROM;

    // Debug: Log if credentials are missing
    if (!user) {
      console.error('EMAIL_SERVER_USER is not configured');
      throw new Error('EMAIL_SERVER_USER not configured');
    }
    if (!pass) {
      console.error('EMAIL_SERVER_PASSWORD is not configured');
      throw new Error('EMAIL_SERVER_PASSWORD not configured');
    }
    if (!from) {
      console.error('EMAIL_FROM is not configured');
      throw new Error('EMAIL_FROM not configured');
    }

    console.log('Creating email transporter for:', user);

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { 
        user, 
        pass 
      },
    });

    // Test connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError: any) {
      console.error('SMTP verification failed:', verifyError.message);
      throw new Error(`SMTP verification failed: ${verifyError.message}`);
    }

    const mailOptions = {
        from: `"FamilySafe" <${from}>`,
        to: to,
        subject: 'Your FamilySafe Verification Code',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #30475E; text-align: center;">FamilySafe Verification</h2>
            <p style="font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">Your one-time password (OTP) to verify your account is:</p>
            <p style="font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0; padding: 10px; background-color: #f2f2f2; border-radius: 5px;">
              ${sanitizedOtp}
            </p>
            <p style="font-size: 16px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin-top: 20px;" />
            <p style="font-size: 12px; color: #888; text-align: center;">&copy; FamilySafe. All rights reserved.</p>
          </div>
        `,
      };

    console.log('Sending email to:', to);
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);

    let response = applyCORSHeaders(
      NextResponse.json({ success: true, message: 'Email sent successfully.' }),
      request
    );
    return response;
  } catch (error: any) {
    console.error('Send email error:', {
      message: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack,
    });
    let response = applyCORSHeaders(
      NextResponse.json({ 
        success: false, 
        message: `Failed to send email: ${error.message}`,
        errorCode: error.code 
      }, { status: 500 }),
      request
    );
    return response;
  }
}
