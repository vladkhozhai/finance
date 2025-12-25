"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "An authentication error occurred";

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">
          Authentication Error
        </CardTitle>
        <CardDescription>
          Something went wrong during authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/sign-in">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <Suspense fallback={<LoadingCard />}>
        <AuthErrorContent />
      </Suspense>
    </main>
  );
}
