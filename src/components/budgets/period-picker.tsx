/**
 * PeriodPicker Component
 *
 * Month/year picker that displays as "January 2025" and outputs as "2025-01-01".
 */

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PeriodPickerProps {
  value: string; // YYYY-MM-01 format
  onChange: (value: string) => void; // Returns YYYY-MM-01
  placeholder?: string;
  className?: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Parses period string (YYYY-MM-01) into month and year.
 */
function parsePeriod(period: string): { month: number; year: number } {
  const [year, month] = period.split("-").map(Number);
  return { month: month - 1, year }; // month is 0-indexed
}

/**
 * Formats month and year into period string (YYYY-MM-01).
 */
function formatPeriod(month: number, year: number): string {
  const monthStr = String(month + 1).padStart(2, "0"); // month is 0-indexed
  return `${year}-${monthStr}-01`;
}

/**
 * Formats period for display (e.g., "January 2025").
 */
function formatDisplay(period: string): string {
  const { month, year } = parsePeriod(period);
  return `${MONTHS[month]} ${year}`;
}

/**
 * Gets the current month period (YYYY-MM-01).
 */
function getCurrentPeriod(): string {
  const now = new Date();
  return formatPeriod(now.getMonth(), now.getFullYear());
}

export function PeriodPicker({
  value,
  onChange,
  placeholder = "Select period",
  className,
}: PeriodPickerProps) {
  const { month, year } = value
    ? parsePeriod(value)
    : parsePeriod(getCurrentPeriod());

  const handlePreviousMonth = () => {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    onChange(formatPeriod(newMonth, newYear));
  };

  const handleNextMonth = () => {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    onChange(formatPeriod(newMonth, newYear));
  };

  const handleMonthChange = (newMonth: string) => {
    onChange(formatPeriod(Number.parseInt(newMonth), year));
  };

  const handleYearChange = (newYear: string) => {
    onChange(formatPeriod(month, Number.parseInt(newYear)));
  };

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={className}>
          {value ? formatDisplay(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="space-y-3">
          {/* Navigation Header */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              {MONTHS[month]} {year}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Month
            </label>
            <Select value={String(month)} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((monthName, idx) => (
                  <SelectItem key={idx} value={String(idx)}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Year
            </label>
            <Select value={String(year)} onValueChange={handleYearChange}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((yearOption) => (
                  <SelectItem key={yearOption} value={String(yearOption)}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
