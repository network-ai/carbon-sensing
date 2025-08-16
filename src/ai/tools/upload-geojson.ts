// upload-geojson.ts (Cleaned)
import type { CreateToolsContext } from "@/ai";
import { getFile } from "@/lib/file-store";
import { tool } from "ai";
import { ulid } from "ulid";
import z from "zod";
import { calculateGeoJSONBounds } from "./carbon-analyze-helper";

export const uploadGeoJSON = (ctx: CreateToolsContext) =>
  tool({
    name: "upload-geojson",
    description:
      "Upload and process GeoJSON vector data for map visualization. Use fileName parameter to reference stored GeoJSON files.",
    inputSchema: z.object({
      fileName: z
        .string()
        .describe("Name of the stored GeoJSON file to process"),
      geojsonData: z
        .string()
        .optional()
        .nullable()
        .describe(
          "Direct GeoJSON data as string (fallback if fileName not found)",
        ),
      style: z
        .object({
          fillColor: z.string().optional().default("#3388ff"),
          fillOpacity: z.number().optional().default(0.2),
          strokeColor: z.string().optional().default("#3388ff"),
          strokeWidth: z.number().optional().default(2),
          strokeOpacity: z.number().optional().default(1),
        })
        .optional()
        .describe("Styling options for the GeoJSON layer"),
    }),
    execute: async ({ fileName, geojsonData, style = {} }) => {
      const dataId = ulid();
      const layerIdForContext = dataId;
      const layerNameForDisplay = `Area of Interest ${dataId}`;

      ctx.writer.write({
        id: layerIdForContext,
        type: "data-maps-geojson",
        data: {
          name: `Processing GeoJSON: ${layerNameForDisplay}`,
          state: "in-progress",
        },
      });

      try {
        let geoJsonContent: string;

        // Prioritize stored file, fallback to direct data
        if (fileName) {
          const storedContent = getFile(fileName);
          if (storedContent) {
            geoJsonContent = storedContent;
          } else if (geojsonData) {
            geoJsonContent = geojsonData;
          } else {
            throw new Error(
              `GeoJSON file "${fileName}" not found in storage and no fallback data provided`,
            );
          }
        } else if (geojsonData) {
          geoJsonContent = geojsonData;
        } else {
          throw new Error("Either fileName or geojsonData must be provided");
        }

        const parsedGeoJSON = JSON.parse(geoJsonContent);

        if (
          !parsedGeoJSON.type ||
          ![
            "FeatureCollection",
            "Feature",
            "Point",
            "LineString",
            "Polygon",
            "MultiPoint",
            "MultiLineString",
            "MultiPolygon",
          ].includes(parsedGeoJSON.type)
        ) {
          throw new Error("Invalid GeoJSON format");
        }

        const bounds = calculateGeoJSONBounds(parsedGeoJSON);
        const featureCount = getFeatureCount(parsedGeoJSON);

        ctx.writer.write({
          id: layerIdForContext,
          type: "data-maps-geojson",
          data: {
            name: fileName
              ? `${fileName.replace(/\.(geo)?json$/i, "")}`
              : layerNameForDisplay,
            state: "completed",
            geojson: parsedGeoJSON,
            style: {
              fillColor: style.fillColor || "#3388ff",
              fillOpacity: style.fillOpacity || 0.2,
              strokeColor: style.strokeColor || "#3388ff",
              strokeWidth: style.strokeWidth || 2,
              strokeOpacity: style.strokeOpacity || 1,
            },
            bounds: bounds,
            featureCount: featureCount,
          },
        });

        // Generate feature details
        let featureDetails = "";
        if (parsedGeoJSON.type === "FeatureCollection") {
          const geometryTypes = parsedGeoJSON.features
            .map((f: any) => f.geometry?.type)
            .filter(Boolean);
          const uniqueTypes = [...new Set(geometryTypes)];
          featureDetails = ` (${uniqueTypes.join(", ")})`;
        } else if (parsedGeoJSON.type === "Feature") {
          featureDetails = ` (${parsedGeoJSON.geometry?.type || "Unknown"})`;
        } else {
          featureDetails = ` (${parsedGeoJSON.type})`;
        }

        const displayName = fileName
          ? fileName.replace(/\.(geo)?json$/i, "")
          : layerNameForDisplay;
        return `GeoJSON layer "${displayName}" uploaded successfully with ${featureCount} features${featureDetails}. Bounds: [${bounds.map((b) => b.toFixed(4)).join(", ")}]`;
      } catch (error) {
        ctx.writer.write({
          id: layerIdForContext,
          type: "data-maps-geojson",
          data: {
            name: `Error processing GeoJSON: ${fileName || layerNameForDisplay}`,
            state: "failed",
            error:
              error instanceof Error
                ? error.message
                : "Failed to process GeoJSON",
          },
        });

        throw error;
      }
    },
  });

/**
 * Count features in GeoJSON
 */
function getFeatureCount(geojson: any): number {
  if (geojson.type === "FeatureCollection") {
    return geojson.features.length;
  } else if (geojson.type === "Feature") {
    return 1;
  } else {
    return 1; // Single geometry
  }
}
