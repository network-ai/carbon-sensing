// hooks/useAdminBoundaryLayer.ts
import { useMap } from "@/components/ui/maps-context";
import { useEffect, useState } from "react";

interface UseAdminBoundaryLayerProps {
  id: string;
  geojsonData: any; // GeoJSON FeatureCollection
  visible?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  fillOpacity?: number;
  labelField?: string;
  labelSize?: number;
  labelColor?: string;
}

export const useAdminBoundaryLayer = ({
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
}: UseAdminBoundaryLayerProps) => {
  const map = useMap();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!map || !geojsonData) return;

    const addAdminLayer = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Adding admin boundary layer: ${id}`);

        // Clean up existing layers and sources
        const layersToRemove = [
          `${id}-fill`,
          `${id}-stroke`,
          `${id}-labels`,
          `${id}-labels-bg`,
        ];
        layersToRemove.forEach((layerId) => {
          if (map.getLayer(layerId)) {
            console.log(`Removing existing layer: ${layerId}`);
            map.removeLayer(layerId);
          }
        });

        if (map.getSource(id)) {
          console.log(`Removing existing source: ${id}`);
          map.removeSource(id);
        }

        // Add GeoJSON source
        map.addSource(id, {
          type: "geojson",
          data: geojsonData,
        });

        // Add fill layer (transparent)
        map.addLayer({
          id: `${id}-fill`,
          type: "fill",
          source: id,
          layout: {
            visibility: visible ? "visible" : "none",
          },
          paint: {
            "fill-color": fillColor,
            "fill-opacity": fillOpacity,
          },
        });

        // Add stroke layer (thick border)
        map.addLayer({
          id: `${id}-stroke`,
          type: "line",
          source: id,
          layout: {
            visibility: visible ? "visible" : "none",
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": strokeColor,
            "line-width": strokeWidth,
            "line-opacity": 0.8,
          },
        });

        // Add label background (white halo effect)
        map.addLayer({
          id: `${id}-labels-bg`,
          type: "symbol",
          source: id,
          layout: {
            visibility: visible ? "visible" : "none",
            "text-field": ["get", labelField],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": labelSize,
            "text-anchor": "center",
            "text-justify": "center",
            "text-allow-overlap": false,
            "text-ignore-placement": false,
          },
          paint: {
            "text-color": "#FFFFFF",
            "text-halo-color": "#FFFFFF",
            "text-halo-width": 3,
            "text-opacity": 0.9,
          },
        });

        // Add main labels
        map.addLayer({
          id: `${id}-labels`,
          type: "symbol",
          source: id,
          layout: {
            visibility: visible ? "visible" : "none",
            "text-field": ["get", labelField],
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-size": labelSize,
            "text-anchor": "center",
            "text-justify": "center",
            "text-allow-overlap": false,
            "text-ignore-placement": false,
            "text-transform": "uppercase",
          },
          paint: {
            "text-color": labelColor,
            "text-halo-color": "#FFFFFF",
            "text-halo-width": 2,
            "text-opacity": 1,
          },
        });

        // Add hover effect
        let hoveredFeatureId: string | number | null = null;

        map.on("mouseenter", `${id}-fill`, (e) => {
          if (e.features && e.features.length > 0) {
            if (hoveredFeatureId !== null) {
              map.setFeatureState(
                { source: id, id: hoveredFeatureId },
                { hover: false },
              );
            }
            hoveredFeatureId = e.features[0].id || null;
            if (hoveredFeatureId !== null) {
              map.setFeatureState(
                { source: id, id: hoveredFeatureId },
                { hover: true },
              );
            }
          }
          map.getCanvas().style.cursor = "pointer";
        });

        map.on("mouseleave", `${id}-fill`, () => {
          if (hoveredFeatureId !== null) {
            map.setFeatureState(
              { source: id, id: hoveredFeatureId },
              { hover: false },
            );
          }
          hoveredFeatureId = null;
          map.getCanvas().style.cursor = "";
        });

        // Add click handler for additional interactivity
        map.on("click", `${id}-fill`, (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const adminName = feature.properties?.[labelField];
            const adminCode = feature.properties?.ADM2_PCODE;

            console.log(`Clicked on ${adminName} (${adminCode})`);

            // Create popup with admin info
            // new mapboxgl.Popup()
            //   .setLngLat(e.lngLat)
            //   .setHTML(`
            //     <div class="p-3">
            //       <h3 class="font-bold text-lg">${adminName}</h3>
            //       <p class="text-sm text-gray-600">Code: ${adminCode}</p>
            //       <p class="text-sm text-gray-600">Province: ${feature.properties?.ADM1_EN}</p>
            //     </div>
            //   `)
            //   .addTo(map);
          }
        });

        console.log(`Successfully added admin boundary layer: ${id}`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add admin layer";
        setError(errorMessage);
        console.error(`Error adding admin boundary layer ${id}:`, err);
      } finally {
        setLoading(false);
      }
    };

    addAdminLayer();

    return () => {
      // Cleanup on unmount
      try {
        const layersToRemove = [
          `${id}-fill`,
          `${id}-stroke`,
          `${id}-labels`,
          `${id}-labels-bg`,
        ];
        layersToRemove.forEach((layerId) => {
          if (map.getLayer(layerId)) {
            console.log(`Cleanup: Removing layer ${layerId}`);
            map.removeLayer(layerId);
          }
        });

        if (map.getSource(id)) {
          console.log(`Cleanup: Removing source ${id}`);
          map.removeSource(id);
        }
      } catch (cleanupError) {
        console.warn(`Cleanup error for ${id}:`, cleanupError);
      }
    };
  }, [
    map,
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
  ]);

  const toggleVisibility = () => {
    if (!map) return;

    try {
      const layersToToggle = [
        `${id}-fill`,
        `${id}-stroke`,
        `${id}-labels`,
        `${id}-labels-bg`,
      ];
      const currentVisibility = map.getLayoutProperty(
        `${id}-fill`,
        "visibility",
      );
      const newVisibility =
        currentVisibility === "visible" ? "none" : "visible";

      layersToToggle.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", newVisibility);
        }
      });
    } catch (err) {
      console.error(`Error toggling visibility for ${id}:`, err);
    }
  };

  const updateStyle = (newStyle: Partial<UseAdminBoundaryLayerProps>) => {
    if (!map) return;

    try {
      if (newStyle.strokeColor && map.getLayer(`${id}-stroke`)) {
        map.setPaintProperty(
          `${id}-stroke`,
          "line-color",
          newStyle.strokeColor,
        );
      }
      if (newStyle.strokeWidth && map.getLayer(`${id}-stroke`)) {
        map.setPaintProperty(
          `${id}-stroke`,
          "line-width",
          newStyle.strokeWidth,
        );
      }
      if (newStyle.fillColor && map.getLayer(`${id}-fill`)) {
        map.setPaintProperty(`${id}-fill`, "fill-color", newStyle.fillColor);
      }
      if (newStyle.fillOpacity !== undefined && map.getLayer(`${id}-fill`)) {
        map.setPaintProperty(
          `${id}-fill`,
          "fill-opacity",
          newStyle.fillOpacity,
        );
      }
      if (newStyle.labelColor && map.getLayer(`${id}-labels`)) {
        map.setPaintProperty(`${id}-labels`, "text-color", newStyle.labelColor);
      }
      if (newStyle.labelSize && map.getLayer(`${id}-labels`)) {
        map.setLayoutProperty(`${id}-labels`, "text-size", newStyle.labelSize);
      }
    } catch (err) {
      console.error(`Error updating style for ${id}:`, err);
    }
  };

  return {
    toggleVisibility,
    updateStyle,
    loading,
    error,
  };
};
