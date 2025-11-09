
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Suspense } from "react";

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
import { loginSchema } from "@/lib/schemas";
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";
import { getSafeRedirectUrl } from "@/lib/utils";
import { FamilySafeLogo } from "@/components/logo";
import { useEffect } from "react";

function LoginPage() {
  const { login, user, loading, sendVerificationEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const redirectTo = getSafeRedirectUrl(searchParams.get("redirect"));

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // Optimized redirect - only redirect when user is fully verified
    if (!loading && user && user.emailVerified) {
      // Use a microtask to avoid blocking the UI
      queueMicrotask(() => {
        router.push(redirectTo);
      });
    }
  }, [user, loading, router, redirectTo]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      // Step 1: Log in the user
      await login(values.email, values.password);
      
      // Step 2: Send OTP
      try {
        await sendVerificationEmail(values.email);
      } catch (emailError: any) {
        // Handle specific email errors
        if (emailError.status === 404) {
          // User not found - they need to sign up first
          toast({
            variant: "destructive",
            title: "Account Not Found",
            description: "This email hasn't been registered yet. Please sign up first.",
          });
          return;
        }
        // For other errors, show a generic error message
        toast({
          variant: "destructive",
          title: "Verification Email Failed",
          description: "Could not send verification email. Please try again.",
        });
        return;
      }
      
      toast({
        title: "Verification Required",
        description: "Please check your inbox for a verification OTP.",
      });

      // Step 3: Redirect to verification page (optimized with no await)
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}&type=login&redirect=${encodeURIComponent(redirectTo)}`);

    } catch (error: any) {
      // For invalid-credential, we need to check if user exists to differentiate
      // between "user doesn't exist" vs "wrong password"
      if (error.code === 'auth/invalid-credential') {
        try {
          // Check if user exists in Firebase Auth
          const checkResponse = await fetch('/api/check-user-exists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: values.email }),
          });
          
          const checkData = await checkResponse.json();
          
          if (!checkData.exists) {
            // User doesn't exist - suggest sign up
            toast({
              variant: "destructive",
              title: "Account Not Found",
              description: "This email hasn't been registered yet. Please sign up first.",
            });
          } else {
            // User exists but password is wrong
            toast({
              variant: "destructive",
              title: "Login Failed",
              description: "Invalid password. Please try again.",
            });
          }
        } catch (checkError) {
          // If check fails, show generic error
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Invalid email or password. Please try again.",
          });
        }
        return;
      }
      
      const message = getFirebaseErrorMessage(error.code);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: message,
      });
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        {/* You can replace this with a proper loading spinner component */}
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
            <FamilySafeLogo className="mb-4 h-12 w-12 text-primary" />
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your secure document vault.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="name@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link
                          href="/forgot-password"
                          className="text-sm font-medium text-accent-foreground/80 hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          {...field}
                        />
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
                  {form.formState.isSubmitting ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

// Wrap with Suspense to handle useSearchParams
export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
