// components/AnimationControl.tsx
import { cn } from "@/utils/classnames";
import type React from "react";
import { useEffect, useState } from "react";

interface AnimationControlProps {
  years: string[];
  activeYear: string;
  onYearChange: (year: string) => void;
  position?: "bottom-right";
  className?: string;
}

export const AnimationControl: React.FC<AnimationControlProps> = ({
  years,
  activeYear,
  onYearChange,
  position = "bottom-right",
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000); // milliseconds
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const currentIndex = years.indexOf(activeYear);
      const nextIndex = (currentIndex + 1) % years.length;
      onYearChange(years[nextIndex]);
    }, speed);

    return () => clearInterval(interval);
  }, [isPlaying, activeYear, years, speed, onYearChange]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    const currentIndex = years.indexOf(activeYear);
    const prevIndex = currentIndex === 0 ? years.length - 1 : currentIndex - 1;
    onYearChange(years[prevIndex]);
  };

  const handleNext = () => {
    const currentIndex = years.indexOf(activeYear);
    const nextIndex = (currentIndex + 1) % years.length;
    onYearChange(years[nextIndex]);
  };

  const positionClasses = {
    "bottom-right": "bottom-20 right-4",
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
            <polygon points="5,3 19,12 5,21" />
          </svg>
          Animation
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
        <div className="border-t p-3 space-y-3" style={{ minWidth: "180px" }}>
          {/* Play Controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handlePrevious}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Previous Year"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="19,20 9,12 19,4" />
                <line x1="5" y1="19" x2="5" y2="5" />
              </svg>
            </button>

            <button
              onClick={handlePlayPause}
              className={cn(
                "p-2 rounded-full transition-colors",
                isPlaying
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-green-100 text-green-600 hover:bg-green-200",
              )}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>

            <button
              onClick={handleNext}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="Next Year"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="5,4 15,12 5,20" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>
          </div>

          {/* Speed Control */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Speed: {speed}ms
            </label>
            <input
              type="range"
              min="500"
              max="3000"
              step="250"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Fast</span>
              <span>Slow</span>
            </div>
          </div>

          {/* Current Status */}
          <div className="text-center p-2 bg-gray-50 rounded text-sm">
            <div className="font-medium">{activeYear}</div>
            <div className="text-xs text-gray-500">
              {years.indexOf(activeYear) + 1} of {years.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
