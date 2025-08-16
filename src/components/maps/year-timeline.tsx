// components/YearTimeline.tsx
import { cn } from "@/utils/classnames";
import React from "react";

interface YearTimelineProps {
  years: string[];
  activeYear: string;
  onYearChange: (year: string) => void;
  position?: "bottom-center" | "top-center";
  className?: string;
}

export const YearTimeline: React.FC<YearTimelineProps> = ({
  years,
  activeYear,
  onYearChange,
  position = "bottom-center",
  className,
}) => {
  const positionClasses = {
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
  };

  return (
    <div
      className={cn(
        "absolute z-20 bg-white rounded-full shadow-lg border px-2 py-1",
        positionClasses[position],
        className,
      )}
    >
      <div className="flex items-center gap-1">
        {years.map((year, index) => (
          <React.Fragment key={year}>
            <button
              onClick={() => onYearChange(year)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                year === activeYear
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-600 hover:text-blue-600 hover:bg-blue-50",
              )}
            >
              {year}
            </button>
            {index < years.length - 1 && (
              <div className="w-2 h-0.5 bg-gray-300 mx-1"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
