// components/CarbonTiffLayer.tsx
import type { LayerType } from "@/utils/carbon-mappings";
import React from "react";
import { useCarbonTiffLayer } from "../../hooks/use-tiff-layer";

interface CarbonTiffLayerProps {
  id: string;
  filename: string;
  year: string;
  layerType: LayerType;
  baselineData?: Record<string, number>;
  visible?: boolean;
  opacity?: number;
  onLoad?: (data: any) => void;
  onError?: (error: string) => void;
}

export const CarbonTiffLayer: React.FC<CarbonTiffLayerProps> = ({
  id,
  filename,
  year,
  layerType,
  baselineData,
  visible = true,
  opacity = 1,
  onLoad,
  onError,
}) => {
  const { loading, error, tiffData } = useCarbonTiffLayer({
    id,
    filename,
    year,
    layerType,
    baselineData,
    visible,
    opacity,
  });

  React.useEffect(() => {
    if (tiffData && onLoad) {
      onLoad(tiffData);
    }
  }, [tiffData, onLoad]);

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (loading) {
    return (
      <div className="absolute top-4 left-4 bg-white p-3 rounded shadow-lg z-10">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
          <span className="text-sm">
            Loading {layerType} for {year}...
          </span>
        </div>
      </div>
    );
  }

  // if (error) {
  //   return (
  //     <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 p-3 rounded shadow-lg z-10">
  //       <div className="text-sm">
  //         <strong>Error loading {layerType} for {year}:</strong>
  //         <br />
  //         {error}
  //       </div>
  //     </div>
  //   );
  // }

  return null;
};
