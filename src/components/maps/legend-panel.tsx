// components/LegendPanel.tsx
import { cn } from "@/utils/classnames";
import type React from "react";
import { useState } from "react";

interface LegendItem {
  value: number;
  color: string;
  label: string;
}

interface LegendPanelProps {
  title: string;
  items: LegendItem[];
  position?: "bottom-left" | "bottom-right";
  className?: string;
}

export const LegendPanel: React.FC<LegendPanelProps> = ({
  title,
  items,
  position = "bottom-left",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const positionClasses = {
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <div
      className={cn(
        "absolute z-20 bg-white rounded-lg shadow-lg border max-w-xs",
        positionClasses[position],
        className,
      )}
    >
      <div className="p-3 border-b bg-gray-50 rounded-t-lg">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-sm font-semibold text-gray-800"
        >
          <span className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            {title}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn("transition-transform", isOpen ? "rotate-180" : "")}
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="p-3 space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-700 flex-1">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
