/**
 * BudgetProgressBar Component
 *
 * Reusable progress bar for budget visualization with color coding based on spending percentage.
 */

"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BudgetProgressBarProps {
  spent: number;
  limit: number;
  className?: string;
  showPercentage?: boolean;
}

/**
 * Determines the progress bar color based on spending percentage.
 * - Green: 0-70% (safe)
 * - Yellow: 71-90% (warning)
 * - Orange: 91-99% (danger)
 * - Red: 100%+ (overspending)
 */
function getProgressColor(percentage: number): string {
  if (percentage >= 100) return "bg-red-500";
  if (percentage >= 91) return "bg-orange-500";
  if (percentage >= 71) return "bg-yellow-500";
  return "bg-green-500";
}

/**
 * Determines text color based on spending percentage.
 */
function getTextColor(percentage: number): string {
  if (percentage >= 100) return "text-red-600";
  if (percentage >= 91) return "text-orange-600";
  if (percentage >= 71) return "text-yellow-600";
  return "text-green-600";
}

export function BudgetProgressBar({
  spent,
  limit,
  className,
  showPercentage = true,
}: BudgetProgressBarProps) {
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  const cappedPercentage = Math.min(percentage, 100); // Cap at 100% for progress bar
  const colorClass = getProgressColor(percentage);
  const textColorClass = getTextColor(percentage);

  return (
    <div className={cn("space-y-1", className)}>
      <Progress
        value={cappedPercentage}
        className="h-2"
        indicatorClassName={colorClass}
      />
      {showPercentage && (
        <div className="flex justify-end">
          <span className={cn("text-xs font-medium", textColorClass)}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
