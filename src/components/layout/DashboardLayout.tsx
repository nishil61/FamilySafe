
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "./Header";
import { Skeleton } from "../ui/skeleton";

function FullPageLoader() {
    return (
        <div className="flex h-screen w-full flex-col">
            {/* Skeleton Header */}
            <div className="flex h-16 items-center justify-between border-b px-4 sm:px-8">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            {/* Skeleton Content */}
            <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="lg:col-span-3 space-y-4">
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is done loading and there's still no user, redirect to login.
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  // While loading, show a skeleton screen.
  if (loading) {
    return <FullPageLoader />;
  }
  
  // If not loading but there is no user, return null while the redirect happens.
  // This prevents rendering the dashboard for a split second before redirecting.
  if (!user) {
    return null;
  }

  // If loading is done and there is a user, show the dashboard.
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col bg-muted/30">{children}</main>
    </div>
  );
}
