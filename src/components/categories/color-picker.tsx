/**
 * ColorPicker Component
 *
 * A simple color picker with preset colors and custom hex input.
 */

"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  error?: string;
}

// Preset colors for quick selection
const PRESET_COLORS = [
  "#EF4444", // red-500
  "#F97316", // orange-500
  "#F59E0B", // amber-500
  "#EAB308", // yellow-500
  "#84CC16", // lime-500
  "#22C55E", // green-500
  "#10B981", // emerald-500
  "#14B8A6", // teal-500
  "#06B6D4", // cyan-500
  "#0EA5E9", // sky-500
  "#3B82F6", // blue-500
  "#6366F1", // indigo-500
  "#8B5CF6", // violet-500
  "#A855F7", // purple-500
  "#D946EF", // fuchsia-500
  "#EC4899", // pink-500
  "#F43F5E", // rose-500
  "#64748B", // slate-500
];

export function ColorPicker({ value, onChange, error }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);

  const handleHexInputChange = (hex: string) => {
    setHexInput(hex);

    // Validate hex format
    const hexRegex = /^#[0-9A-F]{6}$/i;
    if (hexRegex.test(hex)) {
      onChange(hex);
    }
  };

  const handlePresetClick = (color: string) => {
    setHexInput(color);
    onChange(color);
  };

  return (
    <div className="space-y-4">
      {/* Preset colors grid */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Choose a color</Label>
        <div className="grid grid-cols-9 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handlePresetClick(color)}
              className={cn(
                "relative h-10 w-10 rounded-md border-2 transition-all hover:scale-110",
                value.toUpperCase() === color.toUpperCase()
                  ? "border-foreground ring-2 ring-foreground ring-offset-2"
                  : "border-transparent hover:border-muted-foreground",
              )}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            >
              {value.toUpperCase() === color.toUpperCase() && (
                <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom hex input */}
      <div>
        <Label htmlFor="hex-input" className="text-sm font-medium">
          Or enter hex code
        </Label>
        <div className="mt-2 flex items-center gap-2">
          <div
            className="h-10 w-10 rounded-md border-2 border-muted flex-shrink-0"
            style={{ backgroundColor: value }}
          />
          <Input
            id="hex-input"
            type="text"
            placeholder="#000000"
            value={hexInput}
            onChange={(e) => handleHexInputChange(e.target.value.toUpperCase())}
            className="font-mono uppercase"
            maxLength={7}
          />
        </div>
        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          Format: #RRGGBB (e.g., #FF5733)
        </p>
      </div>
    </div>
  );
}
