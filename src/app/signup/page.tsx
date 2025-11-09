
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { signupSchema } from "@/lib/schemas";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { Checkbox } from "@/components/ui/checkbox";
import { FamilySafeLogo } from "@/components/logo";
import { registerUser } from "@/ai/flows/register-user";
import { useAuth } from "@/hooks/useAuth";
import { useUnlock } from "@/context/UnlockContext";


export default function SignupPage() {
  const { sendVerificationEmail } = useAuth();
  const { clearEncryptionKeys } = useUnlock();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = form.watch("password");

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    try {
      // Clear any old encryption keys first (in case this email was used before)
      clearEncryptionKeys();
      
      // Step 1: Call the robust server-side registration flow to create the user.
      const result = await registerUser({ email: values.email, password: values.password });

      if (!result.success) {
        // If the server-side flow returned an error (e.g., email exists), display it.
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: result.message,
        });
        return;
      }
      
      // Step 2: User is created. Now, trigger the client-side OTP generation and email API call.
      try {
        await sendVerificationEmail(values.email);
      } catch (emailError: any) {
        // If email sending fails, show error but don't prevent verification flow
        console.error('Email error:', emailError);
        toast({
          variant: "destructive",
          title: "Verification Email Failed",
          description: "Could not send verification email. Please try again.",
        });
        return;
      }

      toast({
        title: "Account Created",
        description: "Please check your inbox for a verification OTP.",
      });
      
      // Step 3: Redirect to the verification page.
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);

    } catch (error: any) {
        // This will catch network errors or unexpected flow failures.
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.message || "An unexpected error occurred. Please try again.",
        });
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="items-center text-center">
             <FamilySafeLogo className="mb-4 h-12 w-12 text-primary" />
            <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
            <CardDescription>
              Join FamilySafe to securely store your documents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <FormLabel>Password</FormLabel>
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
                <PasswordStrength password={password} />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
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
                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I accept this is for family-only use and understand the security principles.
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Creating..." : "Create Account"}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link href="/" className="font-semibold hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
