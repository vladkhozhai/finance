/**
 * Profile Overview Page
 *
 * Displays user account information, statistics, and quick action links.
 * Shows real data: total transactions, categories, tags, budgets, and balance.
 */

import {
  ArrowRight,
  CreditCard,
  FolderOpen,
  Settings,
  Tag,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

async function getOverviewData(userId: string) {
  const supabase = await createClient();

  // Get profile data
  const { data: profile } = (await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()) as {
    data: { id: string; currency: string; created_at: string } | null;
  };

  // Get counts
  const [
    { count: transactionCount },
    { count: categoryCount },
    { count: tagCount },
    { count: budgetCount },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("tags")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("budgets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  // Calculate total balance (sum of all transactions)
  const { data: transactions } = (await supabase
    .from("transactions")
    .select("amount, type")
    .eq("user_id", userId)) as {
    data: Array<{ amount: number; type: string }> | null;
  };

  const totalBalance =
    transactions?.reduce((sum, t) => {
      return sum + (t.type === "income" ? t.amount : -t.amount);
    }, 0) || 0;

  return {
    profile,
    stats: {
      transactions: transactionCount || 0,
      categories: categoryCount || 0,
      tags: tagCount || 0,
      budgets: budgetCount || 0,
      balance: totalBalance,
    },
  };
}

export default async function ProfileOverviewPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { profile, stats } = await getOverviewData(user.id);

  // Calculate account age
  const createdAt = new Date(user.created_at);
  const now = new Date();
  const daysSinceCreation = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  const currency = profile?.currency || "USD";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">
          Your account summary and statistics
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your personal details and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Email Address
              </p>
              <p className="text-base font-medium mt-1">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Default Currency
              </p>
              <p className="text-base font-medium mt-1">{currency}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Account Age
              </p>
              <p className="text-base font-medium mt-1">
                {daysSinceCreation} days
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Member Since
              </p>
              <p className="text-base font-medium mt-1">
                {createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Balance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currency} {stats.balance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all accounts
              </p>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transactions
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.transactions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Income and expenses
              </p>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categories}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active categories
              </p>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tags</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tags}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Custom labels
              </p>
            </CardContent>
          </Card>

          {/* Budgets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Budgets
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.budgets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Budget trackers
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Jump to common settings and management pages
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Button
            asChild
            variant="outline"
            className="justify-between h-auto py-4"
          >
            <Link href="/profile/payment-methods">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
                <div className="text-left">
                  <div className="font-medium">Manage Payment Methods</div>
                  <div className="text-xs text-muted-foreground">
                    Add or edit your cards and accounts
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="justify-between h-auto py-4"
          >
            <Link href="/profile/categories">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-5 w-5" aria-hidden="true" />
                <div className="text-left">
                  <div className="font-medium">Organize Categories</div>
                  <div className="text-xs text-muted-foreground">
                    Customize your transaction categories
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="justify-between h-auto py-4"
          >
            <Link href="/profile/tags">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5" aria-hidden="true" />
                <div className="text-left">
                  <div className="font-medium">Manage Tags</div>
                  <div className="text-xs text-muted-foreground">
                    Create flexible labels for transactions
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="justify-between h-auto py-4"
          >
            <Link href="/profile/preferences">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5" aria-hidden="true" />
                <div className="text-left">
                  <div className="font-medium">Change Preferences</div>
                  <div className="text-xs text-muted-foreground">
                    Update currency and app settings
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
