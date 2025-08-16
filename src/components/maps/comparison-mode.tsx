// components/ComparisonMode.tsx
import { cn } from "@/utils/classnames";
import type React from "react";
import { useState } from "react";

interface ComparisonModeProps {
  years: string[];
  onComparisonChange: (
    leftYear: string | null,
    rightYear: string | null,
  ) => void;
  position?: "bottom-center";
  className?: string;
}

export const ComparisonMode: React.FC<ComparisonModeProps> = ({
  years,
  onComparisonChange,
  position = "bottom-center",
  className,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [leftYear, setLeftYear] = useState(years[0]);
  const [rightYear, setRightYear] = useState(years[years.length - 1]);

  const toggleComparison = () => {
    const newIsActive = !isActive;
    setIsActive(newIsActive);

    if (newIsActive) {
      onComparisonChange(leftYear, rightYear);
    } else {
      onComparisonChange(null, null);
    }
  };

  const handleLeftYearChange = (year: string) => {
    setLeftYear(year);
    if (isActive) {
      onComparisonChange(year, rightYear);
    }
  };

  const handleRightYearChange = (year: string) => {
    setRightYear(year);
    if (isActive) {
      onComparisonChange(leftYear, year);
    }
  };

  const positionClasses = {
    "bottom-center": "bottom-20 left-1/2 transform -translate-x-1/2",
  };

  return (
    <div
      className={cn(
        "absolute z-20 bg-white rounded-lg shadow-lg border",
        positionClasses[position],
        className,
      )}
    >
      <div className="p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleComparison}
            className={cn(
              "px-3 py-1 rounded text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200",
            )}
          >
            {isActive ? "Exit" : "Compare"}
          </button>

          {isActive && (
            <>
              <select
                value={leftYear}
                onChange={(e) => handleLeftYearChange(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <span className="text-sm text-gray-500">vs</span>

              <select
                value={rightYear}
                onChange={(e) => handleRightYearChange(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
