// components/CarbonLayerSelector.tsx
import { LAYER_OPTIONS, type LayerType } from "@/utils/carbon-mappings";
import { cn } from "@/utils/classnames";
import type React from "react";
import { useState } from "react";

interface CarbonLayerSelectorProps {
  years: string[];
  selectedYear: string;
  selectedLayer: LayerType;
  onYearChange: (year: string) => void;
  onLayerChange: (layer: LayerType) => void;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}

export const CarbonLayerSelector: React.FC<CarbonLayerSelectorProps> = ({
  years,
  selectedYear,
  selectedLayer,
  onYearChange,
  onLayerChange,
  position = "top-left",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  const selectedLayerInfo = LAYER_OPTIONS.find(
    (layer) => layer.id === selectedLayer,
  );

  return (
    <div
      className={cn(
        "absolute z-20 bg-white rounded-lg shadow-lg border min-w-[150px]",
        positionClasses[position],
        className,
      )}
    >
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 rounded-t-lg">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Carbon Analysis Layers
        </h3>
      </div>

      {/* Current Selection */}
      <div className="p-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
        >
          <div className="text-left">
            <div className="font-medium text-green-900">
              {selectedLayerInfo?.name} - {selectedYear}
            </div>
            <div className="text-xs text-green-600">
              {selectedLayerInfo?.description}
            </div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn(
              "transition-transform text-green-600",
              isOpen ? "rotate-180" : "",
            )}
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="border-t max-h-80 overflow-y-auto">
          {/* Year Selection */}
          <div className="p-3 border-b bg-gray-50">
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              Select Year:
            </label>
            <div className="flex flex-wrap gap-1">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => onYearChange(year)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full transition-colors",
                    year === selectedYear
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300",
                  )}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Layer Selection */}
          <div className="p-2 space-y-1 w-[300px]">
            {LAYER_OPTIONS.map((layer) => (
              <button
                key={layer.id}
                onClick={() => {
                  onLayerChange(layer.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-md transition-colors",
                  layer.id === selectedLayer
                    ? "bg-green-100 border border-green-300"
                    : "hover:bg-gray-50 border border-transparent",
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className={cn(
                        "font-medium",
                        layer.id === selectedLayer
                          ? "text-green-900"
                          : "text-gray-800",
                      )}
                    >
                      {layer.name}
                    </div>
                    <div
                      className={cn(
                        "text-xs",
                        layer.id === selectedLayer
                          ? "text-green-600"
                          : "text-gray-500",
                      )}
                    >
                      {layer.description}
                    </div>
                  </div>
                  {layer.id === selectedLayer && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-green-600"
                    >
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
