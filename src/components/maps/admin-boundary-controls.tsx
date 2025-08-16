// components/AdminBoundaryControls.tsx
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Settings } from "lucide-react";
import React from "react";

interface AdminBoundaryControlsProps {
  visible: boolean;
  onToggleVisibility: () => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  fillOpacity: number;
  onFillOpacityChange: (opacity: number) => void;
  labelSize: number;
  onLabelSizeChange: (size: number) => void;
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
}

export const AdminBoundaryControls: React.FC<AdminBoundaryControlsProps> = ({
  visible,
  onToggleVisibility,
  strokeWidth,
  onStrokeWidthChange,
  fillOpacity,
  onFillOpacityChange,
  labelSize,
  onLabelSizeChange,
  position = "top-right",
}) => {
  const [showControls, setShowControls] = React.useState(false);

  const positionClasses = {
    "top-right": "top-4 right-4",
    "bottom-right": "bottom-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/4 transform -translate-x-1/2",
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-20`}>
      <div className="bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleVisibility}
            className="flex items-center gap-1"
          >
            {visible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            Admin Boundaries
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowControls(!showControls)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
