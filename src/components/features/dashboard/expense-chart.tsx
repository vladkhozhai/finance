/**
 * Expense Chart Component
 *
 * Visual chart (pie or bar) showing expense breakdown by category
 * Uses Recharts for visualization
 *
 * @client component - Recharts requires client-side rendering
 */

"use client";

import { PieChartIcon } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ExpenseData {
  name: string;
  amount: number;
  color: string;
  [key: string]: string | number;
}

interface ExpenseChartProps {
  data: ExpenseData[];
  currency: string;
}

export function ExpenseChart({ data, currency }: ExpenseChartProps) {
  // Calculate total for percentage display
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  // Custom label renderer for pie chart
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is significant (>5%)
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload: ExpenseData }>;
  }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0];
      const formattedAmount = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(data.value);

      const percentage = ((data.value / total) * 100).toFixed(1);

      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formattedAmount} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          Expense Breakdown
        </CardTitle>
        <CardDescription>
          Distribution of your expenses by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={renderCustomLabel as any}
                labelLine={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value, _entry) => {
                  const item = data.find((d) => d.name === value);
                  if (!item) return value;

                  const formattedAmount = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: currency,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(item.amount);

                  return `${value}: ${formattedAmount}`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
