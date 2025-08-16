import { Card } from "@/components/ui/card";
import { useMap } from "@/components/ui/maps-context";
import { cn } from "@/utils/classnames";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
import { type FC, useEffect, useRef } from "react";
import type { ToolPart } from ".";
import { store } from "../store";

// Helper function untuk menentukan geometry type
function getGeometryType(geojson: any): string[] {
  const types: string[] = [];

  if (geojson.type === "FeatureCollection") {
    geojson.features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.type) {
        types.push(feature.geometry.type);
      }
    });
  } else if (geojson.type === "Feature") {
    if (geojson.geometry && geojson.geometry.type) {
      types.push(geojson.geometry.type);
    }
  } else {
    types.push(geojson.type);
  }

  return [...new Set(types)]; // Return unique types
}

export const MapsGeoJSON: FC<{
  part: ToolPart<"data-maps-geojson">;
  className?: string;
}> = ({ part, className }) => {
  const processedRef = useRef<Set<string>>(new Set());

  const map = useMap();
  const initialState = useRef(part.data.state);

  useEffect(() => {
    if (initialState.current === "completed") {
      if (part.data.state === "completed") {
        if (map) {
          store.getState().setMap(true);
          const sourceId = `geojson-source-${part.id}`;
          if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
              type: "geojson",
              data: part.data.geojson,
            });
          }
          const geometryTypes = getGeometryType(part.data.geojson);

          // Add Point layers
          if (
            geometryTypes.includes("Point") ||
            geometryTypes.includes("MultiPoint")
          ) {
            const pointLayerId = `geojson-layer-${part.id}-point`;

            map.addLayer({
              id: pointLayerId,
              type: "circle",
              source: sourceId,
              filter: ["==", ["geometry-type"], "Point"],
              paint: {
                "circle-radius": 8,
                "circle-color": part.data.style.fillColor || "#ff6b6b",
                "circle-opacity": 0.8,
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 2,
              },
            });
            map.flyTo({
              center: [
                (part.data.bounds[0] + part.data.bounds[1]) / 2,
                (part.data.bounds[2] + part.data.bounds[3]) / 2,
              ],
              zoom: 12,
              bearing: 0,
              pitch: 0,
            });

            // Verify layer was added
            if (map.getLayer(pointLayerId)) {
            } else {
              console.error("✗ Failed to add Point layer");
            }
          }

          // Add LineString layers
          if (
            geometryTypes.includes("LineString") ||
            geometryTypes.includes("MultiLineString")
          ) {
            const lineLayerId = `geojson-layer-${part.id}-line`;

            map.addLayer({
              id: lineLayerId,
              type: "line",
              source: sourceId,
              filter: ["==", ["geometry-type"], "LineString"],
              paint: {
                "line-color": part.data.style.strokeColor || "#4ecdc4",
                "line-width": 4,
                "line-opacity": 1,
              },
            });
          }

          // Add Polygon layers
          if (
            geometryTypes.includes("Polygon") ||
            geometryTypes.includes("MultiPolygon")
          ) {
            const polygonLayerId = `geojson-layer-${part.id}`;
            const outlineLayerId = `geojson-layer-${part.id}-outline`;

            // Fill layer
            map.addLayer({
              id: polygonLayerId,
              type: "fill",
              source: sourceId,
              filter: ["==", ["geometry-type"], "Polygon"],
              paint: {
                "fill-color": part.data.style.fillColor || "#45b7d1",
                "fill-opacity": 0.3,
              },
            });

            // Outline layer
            map.addLayer({
              id: outlineLayerId,
              type: "line",
              source: sourceId,
              filter: ["==", ["geometry-type"], "Polygon"],
              paint: {
                "line-color": part.data.style.strokeColor || "#2980b9",
                "line-width": 2,
                "line-opacity": 1,
              },
            });

            map.flyTo({
              center: [
                (part.data.bounds[0] + part.data.bounds[2]) / 2,
                (part.data.bounds[1] + part.data.bounds[3]) / 2,
              ],
              zoom: 12,
              bearing: 0,
              pitch: 0,
            });
          }
        }
      }
    }
  }, [part.data.state]);

  // State: In Progress
  if (part.data.state === "in-progress") {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div className="flex-1">
            <h4 className="font-medium">{part.data.name}</h4>
            <p className="text-sm text-muted-foreground">
              Processing GeoJSON data...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // State: Failed
  if (part.data.state === "failed") {
    return (
      <Card className={cn("p-4 border-destructive", className)}>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <div className="flex-1">
            <h4 className="font-medium text-destructive">{part.data.name}</h4>
            <p className="text-sm text-muted-foreground">
              Error: {part.data.error || "Failed to load GeoJSON"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // State: Completed
  const geometryTypes = part.data.geojson
    ? getGeometryType(part.data.geojson)
    : [];

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center gap-3">
        <MapPin className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <h4 className="font-medium">{part.data.name}</h4>
          <p className="text-sm text-muted-foreground">
            {part.data.featureCount} features • {geometryTypes.join(", ")}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t">
        <div className="grid grid-cols-3 gap-2 text-xs">
          {geometryTypes.includes("Point") && (
            <div className="bg-red-50 px-2 py-1 rounded">
              <span className="text-red-700">● Points</span>
            </div>
          )}
          {geometryTypes.includes("LineString") && (
            <div className="bg-teal-50 px-2 py-1 rounded">
              <span className="text-teal-700">— Lines</span>
            </div>
          )}
          {geometryTypes.includes("Polygon") && (
            <div className="bg-blue-50 px-2 py-1 rounded">
              <span className="text-blue-700">■ Areas</span>
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          Status: {part.data.state === "completed" ? "Processed" : "Pending"} |
          Map: {map ? "Ready" : "Loading"} | Part:{" "}
          {part.data.state === "completed" ? part.id?.slice(-8) : "Pending"}
        </div>
      </div>
    </Card>
  );
};
