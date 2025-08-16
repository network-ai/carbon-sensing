// components/CarbonStatistics.tsx - Panel statistik real-time
import {
  CARBON_STOCK_MAP,
  LAYER_OPTIONS,
  type LayerType,
  LULC_LABELS,
} from "@/utils/carbon-mappings";
import { cn } from "@/utils/classnames";
import type React from "react";
import { useEffect, useState } from "react";

interface CarbonStatisticsProps {
  year: string;
  layerType: LayerType;
  tiffData?: any;
  position?: "bottom-center";
  className?: string;
}

export const CarbonStatistics: React.FC<CarbonStatisticsProps> = ({
  year,
  layerType,
  tiffData,
  position = "bottom-center",
  className,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  useEffect(() => {
    if (tiffData) {
      // Calculate statistics from TIFF data
      const calculateStats = () => {
        const { data } = tiffData;
        const classDistribution: Record<number, number> = {};
        let totalValue = 0;
        let validPixels = 0;

        // Count class distribution
        for (let i = 0; i < data.length; i++) {
          const classValue = data[i];
          if (classValue >= 0 && classValue <= 17) {
            classDistribution[classValue] =
              (classDistribution[classValue] || 0) + 1;

            // Calculate total carbon based on layer type
            let pixelValue = 0;
            switch (layerType) {
              case "carbon_stock":
                pixelValue = CARBON_STOCK_MAP[classValue] || 0;
                break;
              case "forest_growth":
                // Simplified calculation for demo
                pixelValue = (CARBON_STOCK_MAP[classValue] || 0) * 0.1;
                break;
              case "net_sequestration":
                pixelValue = (CARBON_STOCK_MAP[classValue] || 0) * 0.09; // After 10% leakage
                break;
              case "min_marketable":
                pixelValue = (CARBON_STOCK_MAP[classValue] || 0) * 0.09 * 30;
                break;
              case "max_marketable":
                pixelValue = (CARBON_STOCK_MAP[classValue] || 0) * 0.09 * 70;
                break;
            }

            totalValue += pixelValue;
            validPixels++;
          }
        }

        return {
          totalValue,
          averageValue: validPixels > 0 ? totalValue / validPixels : 0,
          validPixels,
          totalPixels: data.length,
          classDistribution,
          dominantClass: Object.entries(classDistribution).reduce((a, b) =>
            classDistribution[parseInt(a[0])] >
            classDistribution[parseInt(b[0])]
              ? a
              : b,
          )[0],
        };
      };

      setStats(calculateStats());
    }
  }, [tiffData, layerType]);

  if (!stats) return null;

  const getUnitLabel = () => {
    switch (layerType) {
      case "carbon_stock":
      case "forest_growth":
      case "net_sequestration":
        return "Mg C";
      case "min_marketable":
      case "max_marketable":
        return "Credits";
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "absolute z-20 bg-white rounded-lg shadow-lg border max-w-sm",
        positionClasses[position],
        className,
      )}
    >
      <div className="p-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 w-full text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 11H1v2h8v8h2v-8h8v-2h-8V3H9v8z" />
          </svg>
          Statistics ({year})
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
        <div className="border-t p-3 space-y-2">
          <div className="text-xs font-semibold text-gray-800">
            {LAYER_OPTIONS.find((l) => l.id === layerType)?.name}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 p-2 rounded">
              <div className="text-blue-600 font-medium">Total</div>
              <div className="text-blue-900">
                {stats.totalValue.toLocaleString()} {getUnitLabel()}
              </div>
            </div>

            <div className="bg-green-50 p-2 rounded">
              <div className="text-green-600 font-medium">Average</div>
              <div className="text-green-900">
                {stats.averageValue.toFixed(2)} {getUnitLabel()}
              </div>
            </div>

            <div className="bg-purple-50 p-2 rounded">
              <div className="text-purple-600 font-medium">Valid Pixels</div>
              <div className="text-purple-900">
                {stats.validPixels.toLocaleString()}
              </div>
            </div>

            <div className="bg-orange-50 p-2 rounded">
              <div className="text-orange-600 font-medium">Dominant Class</div>
              <div className="text-orange-900">
                {LULC_LABELS[parseInt(stats.dominantClass)]}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Coverage:{" "}
            {((stats.validPixels / stats.totalPixels) * 100).toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
};
