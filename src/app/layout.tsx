import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { UnlockProvider } from "@/context/UnlockContext";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FamilySafe",
  description: "Your secure family document vault.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans antialiased h-full`} suppressHydrationWarning>
        <AuthProvider>
          <UnlockProvider>
            {children}
            <Toaster />
          </UnlockProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
