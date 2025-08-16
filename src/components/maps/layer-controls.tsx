// components/LayerControls.tsx - Updated with Admin Boundaries
import { cn } from "@/utils/classnames";
import type React from "react";
import { useState } from "react";

interface LayerControlsProps {
  // Carbon layer controls
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;

  // Admin boundaries controls
  adminVisible?: boolean;
  onAdminVisibilityChange?: (visible: boolean) => void;
  adminStrokeWidth?: number;
  onAdminStrokeWidthChange?: (width: number) => void;
  adminFillOpacity?: number;
  onAdminFillOpacityChange?: (opacity: number) => void;
  adminLabelSize?: number;
  onAdminLabelSizeChange?: (size: number) => void;
  adminDataLoaded?: boolean;

  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center";
  className?: string;
}

export const LayerControls: React.FC<LayerControlsProps> = ({
  // Carbon layer props
  opacity,
  onOpacityChange,
  visible,
  onVisibilityChange,

  // Admin boundaries props
  adminVisible = false,
  onAdminVisibilityChange,
  adminStrokeWidth = 3,
  onAdminStrokeWidthChange,
  adminFillOpacity = 0.1,
  onAdminFillOpacityChange,
  adminLabelSize = 14,
  onAdminLabelSizeChange,
  adminDataLoaded = false,

  position = "top-right",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"carbon" | "admin">("carbon");

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
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
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Layer Controls
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
        <div className="border-t" style={{ minWidth: "240px" }}>
          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("carbon")}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium transition-colors",
                activeTab === "carbon"
                  ? "text-green-600 border-b-2 border-green-600 bg-green-50"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              Carbon Data
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-medium transition-colors relative",
                activeTab === "admin"
                  ? "text-orange-600 border-b-2 border-orange-600 bg-orange-50"
                  : "text-gray-500 hover:text-gray-700",
              )}
              disabled={!adminDataLoaded}
            >
              Admin Boundaries
              {!adminDataLoaded && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-gray-400 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Carbon Data Controls */}
          {activeTab === "carbon" && (
            <div className="p-3 space-y-4">
              {/* Visibility Toggle */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => onVisibilityChange(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  Show Carbon Layer
                </label>
              </div>

              {/* Opacity Slider */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Opacity: {Math.round(opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={!visible}
                  style={{
                    background: visible
                      ? `linear-gradient(to right, #10B981 0%, #10B981 ${opacity * 100}%, #E5E7EB ${opacity * 100}%, #E5E7EB 100%)`
                      : "#E5E7EB",
                  }}
                />
              </div>

              <div className="text-xs text-gray-500 pt-2 border-t">
                Adjust visibility and transparency of carbon analysis data
              </div>
            </div>
          )}

          {/* Admin Boundaries Controls */}
          {activeTab === "admin" && (
            <div className="p-3 space-y-4">
              {!adminDataLoaded ? (
                <div className="text-center py-4">
                  <div className="text-sm text-gray-500">
                    Administrative boundaries not loaded
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Check if riau_adm2.geojson exists in public folder
                  </div>
                </div>
              ) : (
                <>
                  {/* Admin Visibility Toggle */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={adminVisible}
                        onChange={(e) =>
                          onAdminVisibilityChange?.(e.target.checked)
                        }
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      Show Admin Boundaries
                    </label>
                  </div>

                  {adminVisible && (
                    <>
                      {/* Border Width */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Border Width: {adminStrokeWidth}px
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="8"
                          step="1"
                          value={adminStrokeWidth}
                          onChange={(e) =>
                            onAdminStrokeWidthChange?.(parseInt(e.target.value))
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #F97316 0%, #F97316 ${((adminStrokeWidth - 1) / 7) * 100}%, #E5E7EB ${((adminStrokeWidth - 1) / 7) * 100}%, #E5E7EB 100%)`,
                          }}
                        />
                      </div>

                      {/* Fill Opacity */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Fill Opacity: {Math.round(adminFillOpacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="0.5"
                          step="0.05"
                          value={adminFillOpacity}
                          onChange={(e) =>
                            onAdminFillOpacityChange?.(
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #F97316 0%, #F97316 ${(adminFillOpacity / 0.5) * 100}%, #E5E7EB ${(adminFillOpacity / 0.5) * 100}%, #E5E7EB 100%)`,
                          }}
                        />
                      </div>

                      {/* Label Size */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Label Size: {adminLabelSize}px
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="20"
                          step="1"
                          value={adminLabelSize}
                          onChange={(e) =>
                            onAdminLabelSizeChange?.(parseInt(e.target.value))
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #F97316 0%, #F97316 ${((adminLabelSize - 10) / 10) * 100}%, #E5E7EB ${((adminLabelSize - 10) / 10) * 100}%, #E5E7EB 100%)`,
                          }}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
