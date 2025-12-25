import { FileText, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="text-center">
        <div className="inline-flex items-center justify-center mb-6">
          <div className="relative">
            <FileText className="h-16 w-16 text-primary" />
            <div className="absolute -bottom-1 -right-1 rounded-full bg-white dark:bg-zinc-900 p-1">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2">Loading CVFlow</h2>
        <p className="text-muted-foreground">
          Preparing your professional profile...
        </p>
      </div>
    </main>
  );
}
