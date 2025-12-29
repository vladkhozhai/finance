"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/actions/auth";

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const result = await signOut();
      if (result.success) {
        // Redirect to sign-in page after successful sign out
        router.push("/sign-in");
        router.refresh();
      } else {
        console.error("Sign out failed:", result.error);
        alert(result.error || "Failed to sign out");
      }
    } catch (error) {
      console.error("Unexpected sign out error:", error);
      alert("An unexpected error occurred while signing out");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing out...
        </>
      ) : (
        "Sign out"
      )}
    </Button>
  );
}
