
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { Suspense, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { FamilySafeLogo } from "@/components/logo";
import { getSafeRedirectUrl } from "@/lib/utils";

const verifyEmailSchema = z.object({
  otp: z.string().min(6, { message: "OTP must be 6 digits." }).max(6),
});

function VerifyEmailContent() {
  const { verifyEmail, sendVerificationEmail, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const type = searchParams.get("type"); // 'login' or from signup (null)
  const redirect = getSafeRedirectUrl(searchParams.get("redirect"));

  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const form = useForm<z.infer<typeof verifyEmailSchema>>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      otp: "",
    },
  });

  async function onSubmit(values: z.infer<typeof verifyEmailSchema>) {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Email is missing. Please sign up or sign in again.",
      });
      return;
    }
    try {
      form.setValue("otp", ""); // Clear OTP field
      form.clearErrors();
      
      await verifyEmail(email, values.otp);
      toast({
        title: type === 'login' ? "Login Successful" : "Email Verified",
        description: type === 'login' ? "Welcome back!" : "Your account is now active. You may now log in.",
      });
      // Redirect to the specified location or dashboard
      router.push(redirect);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: getFirebaseErrorMessage(error.code),
      });
    }
  }

  const handleResendOtp = async () => {
    if (!email || isResendDisabled) {
      return;
    }
    try {
      await sendVerificationEmail(email);
      toast({
        title: "OTP Resent",
        description: "A new OTP has been sent to your email.",
      });
      setResendCooldown(60);
      setIsResendDisabled(true);
    } catch (error: any) {
      if (error.status === 404) {
        toast({
          variant: "destructive",
          title: "Account Not Found",
          description: "This email hasn't been registered yet. Please sign up first.",
        });
        // Redirect to signup
        router.push("/signup");
        return;
      }
      toast({
        variant: "destructive",
        title: "Failed to resend OTP",
        description: error.message || "Please try again in a moment.",
      });
    }
  };

  if (!email) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-2xl font-bold">Error</CardTitle>
            <CardDescription>
              No email address provided. Please go back to the{" "}
              <Link href="/" className="underline">
                sign in page
              </Link>
              .
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <FamilySafeLogo className="mb-4 h-12 w-12 text-primary" />
            <CardTitle className="text-2xl font-bold">Verify Your Identity</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to {email}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>One-Time Password (OTP)</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} maxLength={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Verifying..." : "Verify"}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center text-sm">
              Didn't receive a code?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold"
                onClick={handleResendOtp}
                type="button"
                disabled={isResendDisabled}
              >
                {isResendDisabled ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </Button>
            </div>
             <div className="mt-4 text-center text-sm">
              <Link href="/" className="font-semibold text-muted-foreground hover:underline">
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
