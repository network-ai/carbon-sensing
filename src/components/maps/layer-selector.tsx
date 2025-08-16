// components/LayerSelector.tsx
import { cn } from "@/utils/classnames";
import type React from "react";
import { useState } from "react";

interface LayerOption {
  id: string;
  name: string;
  year: string;
  filename: string;
  description?: string;
}

interface LayerSelectorProps {
  layers: LayerOption[];
  activeLayerId: string;
  onLayerChange: (layerId: string) => void;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}

export const LayerSelector: React.FC<LayerSelectorProps> = ({
  layers,
  activeLayerId,
  onLayerChange,
  position = "top-left",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeLayer = layers.find((layer) => layer.id === activeLayerId);

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <div
      className={cn(
        "absolute z-20 bg-white rounded-lg shadow-lg border min-w-[200px]",
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
            <path d="M3 3h18v18H3zM9 9h6v6H9z" />
          </svg>
          LULC Layers
        </h3>
      </div>

      {/* Current Selection */}
      <div className="p-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
        >
          <div className="text-left">
            <div className="font-medium text-blue-900">{activeLayer?.name}</div>
            <div className="text-xs text-blue-600">
              {activeLayer?.description || "Land Use Land Cover"}
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
              "transition-transform text-blue-600",
              isOpen ? "rotate-180" : "",
            )}
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="border-t max-h-64 overflow-y-auto">
          <div className="p-2 space-y-1">
            {layers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => {
                  onLayerChange(layer.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-md transition-colors",
                  layer.id === activeLayerId
                    ? "bg-blue-100 border border-blue-300"
                    : "hover:bg-gray-50 border border-transparent",
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className={cn(
                        "font-medium",
                        layer.id === activeLayerId
                          ? "text-blue-900"
                          : "text-gray-800",
                      )}
                    >
                      {layer.name}
                    </div>
                    <div
                      className={cn(
                        "text-xs",
                        layer.id === activeLayerId
                          ? "text-blue-600"
                          : "text-gray-500",
                      )}
                    >
                      {layer.description || "Predicted Land Use Land Cover"}
                    </div>
                  </div>
                  {layer.id === activeLayerId && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-600"
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
