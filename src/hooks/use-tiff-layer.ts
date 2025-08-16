// hooks/useCarbonTiffLayer.ts - Fixed version
import { useMap } from "@/components/ui/maps-context";
import {
  createCarbonStockColorMap,
  createForestGrowthColorMap,
  createMaxMarketableColorMap,
  createMinMarketableColorMap,
  createNetSequestrationColorMap,
  type LayerType,
} from "@/utils/carbon-mappings";
import { useEffect, useState } from "react";
import {
  loadTiffFromPublic,
  tiffToImageData,
  type TiffData,
} from "./tiff-loader";

interface UseCarbonTiffLayerProps {
  id: string;
  filename: string;
  year: string;
  layerType: LayerType;
  baselineData?: Record<string, number>;
  visible?: boolean;
  opacity?: number;
}

export const useCarbonTiffLayer = ({
  id,
  filename,
  year,
  layerType,
  baselineData,
  visible = true,
  opacity = 1,
}: UseCarbonTiffLayerProps) => {
  const map = useMap();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tiffData, setTiffData] = useState<TiffData | null>(null);

  useEffect(() => {
    if (!map) return;

    const loadAndAddTiff = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Loading TIFF layer: ${id} for ${filename}`);

        // Clean up existing layer and source first
        if (map.getLayer(id)) {
          console.log(`Removing existing layer: ${id}`);
          map.removeLayer(id);
        }
        if (map.getSource(id)) {
          console.log(`Removing existing source: ${id}`);
          map.removeSource(id);
        }

        // Load TIFF data
        const data = await loadTiffFromPublic(filename);
        setTiffData(data);

        // Create appropriate color map based on layer type
        let colorMap: (value: number) => [number, number, number, number];

        switch (layerType) {
          case "carbon_stock":
            colorMap = createCarbonStockColorMap;
            break;
          case "forest_growth":
            colorMap = createForestGrowthColorMap(baselineData || {});
            break;
          case "net_sequestration":
            colorMap = createNetSequestrationColorMap(baselineData || {});
            break;
          case "min_marketable":
            colorMap = createMinMarketableColorMap(baselineData || {});
            break;
          case "max_marketable":
            colorMap = createMaxMarketableColorMap(baselineData || {});
            break;
          default:
            colorMap = createCarbonStockColorMap;
        }

        // Convert to ImageData
        const imageData = tiffToImageData(data, colorMap);

        // Create canvas and draw image
        const canvas = document.createElement("canvas");
        canvas.width = data.width;
        canvas.height = data.height;
        const ctx = canvas.getContext("2d")!;
        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to data URL
        const dataUrl = canvas.toDataURL();

        console.log(`Adding new source and layer: ${id}`);

        // Add image source to map
        map.addSource(id, {
          type: "image",
          url: dataUrl,
          coordinates: [
            [data.bbox[0], data.bbox[3]], // top-left
            [data.bbox[2], data.bbox[3]], // top-right
            [data.bbox[2], data.bbox[1]], // bottom-right
            [data.bbox[0], data.bbox[1]], // bottom-left
          ],
        });

        // Add layer
        map.addLayer({
          id,
          type: "raster",
          source: id,
          layout: {
            visibility: visible ? "visible" : "none",
          },
          paint: {
            "raster-opacity": opacity,
          },
        });

        console.log(`Successfully loaded ${layerType} for ${year}`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load TIFF";
        setError(errorMessage);
        console.error(`Error loading carbon TIFF layer ${id}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadAndAddTiff();

    return () => {
      // Cleanup on unmount
      try {
        if (map.getLayer(id)) {
          console.log(`Cleanup: Removing layer ${id}`);
          map.removeLayer(id);
        }
        if (map.getSource(id)) {
          console.log(`Cleanup: Removing source ${id}`);
          map.removeSource(id);
        }
      } catch (cleanupError) {
        console.warn(`Cleanup error for ${id}:`, cleanupError);
      }
    };
  }, [map, id, filename, layerType, visible, opacity, baselineData]);

  const toggleVisibility = () => {
    if (!map || !map.getLayer(id)) return;

    try {
      const visibility = map.getLayoutProperty(id, "visibility");
      map.setLayoutProperty(
        id,
        "visibility",
        visibility === "visible" ? "none" : "visible",
      );
    } catch (err) {
      console.error(`Error toggling visibility for ${id}:`, err);
    }
  };

  const setOpacity = (newOpacity: number) => {
    if (!map || !map.getLayer(id)) return;

    try {
      map.setPaintProperty(id, "raster-opacity", newOpacity);
    } catch (err) {
      console.error(`Error setting opacity for ${id}:`, err);
    }
  };

  return {
    toggleVisibility,
    setOpacity,
    loading,
    error,
    tiffData,
  };
};
