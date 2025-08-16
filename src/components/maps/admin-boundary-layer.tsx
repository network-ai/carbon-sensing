// components/AdminBoundaryLayer.tsx
import React from "react";
import { useAdminBoundaryLayer } from "../../hooks/use-admin-boundary";

interface AdminBoundaryLayerProps {
  id: string;
  geojsonData: any;
  visible?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  fillOpacity?: number;
  labelField?: string;
  labelSize?: number;
  labelColor?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export const AdminBoundaryLayer: React.FC<AdminBoundaryLayerProps> = ({
  id,
  geojsonData,
  visible = true,
  strokeColor = "#FF6B35",
  strokeWidth = 3,
  fillColor = "#FF6B35",
  fillOpacity = 0.1,
  labelField = "ADM2_EN",
  labelSize = 14,
  labelColor = "#2D3748",
  onLoad,
  onError,
}) => {
  const { loading, error, toggleVisibility, updateStyle } =
    useAdminBoundaryLayer({
      id,
      geojsonData,
      visible,
      strokeColor,
      strokeWidth,
      fillColor,
      fillOpacity,
      labelField,
      labelSize,
      labelColor,
    });

  React.useEffect(() => {
    if (!loading && !error && onLoad) {
      onLoad();
    }
  }, [loading, error, onLoad]);

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (loading) {
    return (
      <div className="absolute top-20 left-4 bg-white p-3 rounded shadow-lg z-10">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
          <span className="text-sm">Loading administrative boundaries...</span>
        </div>
      </div>
    );
  }

  return null;
};
