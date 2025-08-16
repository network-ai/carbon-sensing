// components/DynamicLegend.tsx
import {
  generateLegendItems,
  LAYER_OPTIONS,
  type LayerType,
} from "@/utils/carbon-mappings";
import { cn } from "@/utils/classnames";
import type React from "react";
import { useState } from "react";

interface DynamicLegendProps {
  layerType: LayerType;
  year: string;
  position?: "bottom-left" | "bottom-right";
  className?: string;
}

export const DynamicLegend: React.FC<DynamicLegendProps> = ({
  layerType,
  year,
  position = "bottom-left",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const positionClasses = {
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "top-center": "top-4 center-4",
  };

  const layerInfo = LAYER_OPTIONS.find((layer) => layer.id === layerType);
  const legendItems = generateLegendItems(layerType);

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
            {layerInfo?.name} ({year})
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
          <div className="text-xs text-gray-600 mb-3">
            {layerInfo?.description}
          </div>
          {legendItems.map((item, index) => (
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
