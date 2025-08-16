// components/AdvancedCarbonControls.tsx - Kontrol tambahan untuk analisis lanjutan
import { LAYER_OPTIONS, type LayerType } from "@/utils/carbon-mappings";
import { cn } from "@/utils/classnames";
import type React from "react";
import { useState } from "react";

interface AdvancedCarbonControlsProps {
  onCompareYears: (year1: string, year2: string) => void;
  onExportData: (layerType: LayerType, year: string) => void;
  availableYears: string[];
  position?: "bottom-right";
  className?: string;
}

export const AdvancedCarbonControls: React.FC<AdvancedCarbonControlsProps> = ({
  onCompareYears,
  onExportData,
  availableYears,
  position = "bottom-right",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [compareYear1, setCompareYear1] = useState(availableYears[0]);
  const [compareYear2, setCompareYear2] = useState(
    availableYears[availableYears.length - 1],
  );

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
  };

  return (
    <div
      className={cn(
        "absolute z-20 bg-white rounded-lg shadow-lg border",
        positionClasses[position],
        className,
      )}
    >
      <div className="p-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 w-full text-sm font-medium text-gray-700 hover:text-gray-900 p-2 rounded hover:bg-gray-50"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 11H1v2h8v8h2v-8h8v-2h-8V3H9v8z" />
          </svg>
          Advanced Tools
          <svg
            width="12"
            height="12"
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
        <div className="border-t p-3 space-y-4" style={{ minWidth: "250px" }}>
          {/* Year Comparison */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Compare Years:
            </label>
            <div className="flex gap-2">
              <select
                value={compareYear1}
                onChange={(e) => setCompareYear1(e.target.value)}
                className="flex-1 text-xs border rounded px-2 py-1"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500 flex items-center">
                vs
              </span>
              <select
                value={compareYear2}
                onChange={(e) => setCompareYear2(e.target.value)}
                className="flex-1 text-xs border rounded px-2 py-1"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => onCompareYears(compareYear1, compareYear2)}
              className="w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              Compare
            </button>
          </div>

          {/* Quick Analysis */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Quick Analysis:
            </label>
            <div className="grid grid-cols-2 gap-1">
              <button className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 transition-colors">
                Growth Trend
              </button>
              <button className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded hover:bg-purple-200 transition-colors">
                Credit Potential
              </button>
              <button className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200 transition-colors">
                Best Areas
              </button>
              <button className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors">
                Loss Areas
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Export Data:
            </label>
            <div className="grid grid-cols-1 gap-1">
              {LAYER_OPTIONS.slice(0, 3).map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => onExportData(layer.id, compareYear2)}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors text-left"
                >
                  Export {layer.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
