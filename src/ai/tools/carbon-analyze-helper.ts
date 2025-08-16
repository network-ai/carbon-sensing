// utils/carbon-analysis-helper.ts
import { chatDB } from "@/config/db";
import { getFile } from "@/lib/file-store";
import { CARBON_STOCK_MAP, LULC_LABELS } from "@/utils/carbon-mappings";
import type {
  AvailableGeoJSONLayer,
  GeoJSONAttachment,
  MessageWithAttachments,
  RedFlagAnalysisResult,
} from "../parts";

// ============================================================
// CARBON STOCK MAPPINGS & CONSTANTS
// ============================================================

export type LayerType =
  | "carbon_stock"
  | "forest_growth"
  | "net_sequestration"
  | "min_marketable"
  | "max_marketable";

// ============================================================
// DATA PROCESSING UTILITIES
// ============================================================

/**
 * Load CSV data from public directory
 */
export async function loadCSVFromPublic(year: number): Promise<string | null> {
  try {
    const fileName = `${year}_xyz.csv`;
    const baseUrl =
      typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.host}`
        : "http://localhost:3000";

    const response = await fetch(`${baseUrl}/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${fileName}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    return null;
  }
}

/**
 * Parse CSV coordinates data
 */
export function parseCSVCoordinates(
  csvData: string,
): Array<{ x: number; y: number; lulcClass: number }> {
  const lines = csvData.trim().split("\n");
  const coordinates: Array<{ x: number; y: number; lulcClass: number }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length >= 3) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      const lulcClass = parseInt(parts[2]);

      if (!isNaN(x) && !isNaN(y) && !isNaN(lulcClass)) {
        coordinates.push({ x, y, lulcClass });
      }
    }
  }

  return coordinates;
}

/**
 * Reclassify LULC data to carbon stock values
 */
export function reclassifyToCarbon(
  coordinates: Array<{ x: number; y: number; lulcClass: number }>,
) {
  return coordinates.map((coord) => ({
    x: coord.x,
    y: coord.y,
    lulcClass: coord.lulcClass,
    carbonStock: CARBON_STOCK_MAP[coord.lulcClass] || 0,
  }));
}

/**
 * Calculate carbon statistics from data points
 */
export function calculateCarbonStatistics(
  data: Array<{ x: number; y: number; lulcClass: number; carbonStock: number }>,
) {
  const totalCarbon = data.reduce((sum, point) => sum + point.carbonStock, 0);
  const averageCarbon = totalCarbon / data.length;

  const carbonByClass: Record<
    number,
    { count: number; totalCarbon: number; averageCarbon: number }
  > = {};
  data.forEach((point) => {
    if (!carbonByClass[point.lulcClass]) {
      carbonByClass[point.lulcClass] = {
        count: 0,
        totalCarbon: 0,
        averageCarbon: 0,
      };
    }
    carbonByClass[point.lulcClass].count++;
    carbonByClass[point.lulcClass].totalCarbon += point.carbonStock;
  });

  Object.values(carbonByClass).forEach((classData) => {
    classData.averageCarbon = classData.totalCarbon / classData.count;
  });

  const maxCarbon = Math.max(...data.map((p) => p.carbonStock));
  const minCarbon = Math.min(
    ...data.filter((p) => p.carbonStock > 0).map((p) => p.carbonStock),
  );

  return {
    totalCarbon,
    averageCarbon,
    maxCarbon,
    minCarbon,
    carbonByClass,
    totalArea: data.length * 0.01,
    pixelCount: data.length,
  };
}

/**
 * Calculate data bounds (bounding box)
 */
export function calculateDataBounds(
  data: Array<{ x: number; y: number }>,
): [number, number, number, number] {
  const lngs = data.map((p) => p.x);
  const lats = data.map((p) => p.y);

  return [
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats),
  ];
}

// ============================================================
// GEOJSON UTILITIES
// ============================================================

/**
 * Extract polygon coordinates from various GeoJSON structures
 */
export function extractPolygonCoordinates(geojsonGeometry: any): number[][][] {
  let coordinates: number[][][] = [];

  if (geojsonGeometry.type === "Polygon") {
    coordinates = [geojsonGeometry.coordinates[0]];
  } else if (geojsonGeometry.type === "MultiPolygon") {
    coordinates = geojsonGeometry.coordinates.map(
      (polygon: number[][][]) => polygon[0],
    );
  } else if (geojsonGeometry.type === "Feature" && geojsonGeometry.geometry) {
    if (geojsonGeometry.geometry.type === "Polygon") {
      coordinates = [geojsonGeometry.geometry.coordinates[0]];
    } else if (geojsonGeometry.geometry.type === "MultiPolygon") {
      coordinates = geojsonGeometry.geometry.coordinates.map(
        (polygon: number[][][]) => polygon[0],
      );
    }
  } else if (geojsonGeometry.type === "FeatureCollection") {
    for (const feature of geojsonGeometry.features) {
      if (feature.geometry) {
        if (feature.geometry.type === "Polygon") {
          coordinates.push(feature.geometry.coordinates[0]);
        } else if (feature.geometry.type === "MultiPolygon") {
          const multiPolygonCoords = feature.geometry.coordinates.map(
            (polygon: number[][][]) => polygon[0],
          );
          coordinates.push(...multiPolygonCoords);
        }
      }
    }

    if (coordinates.length === 0) {
      throw new Error(
        "FeatureCollection does not contain any Polygon or MultiPolygon features",
      );
    }
  } else {
    throw new Error(
      `Unsupported GeoJSON type: ${geojsonGeometry.type}. Must be Polygon, MultiPolygon, Feature, or FeatureCollection`,
    );
  }

  return coordinates;
}

/**
 * Point-in-polygon test using ray casting algorithm
 */
export function isPointInPolygon(
  point: [number, number],
  polygon: number[][],
): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calculate polygon area using Web Mercator projection approximation
 */
export function calculatePolygonArea(geojsonGeometry: any): number {
  try {
    const allCoordinates = extractPolygonCoordinates(geojsonGeometry);
    let totalArea = 0;

    for (const coordinates of allCoordinates) {
      const area = calculatePolygonAreaWithProjection(coordinates);
      totalArea += area;
    }

    // Convert to hectares (1 hectare = 10,000 m²)
    return totalArea / 10000;
  } catch (error) {
    console.error("Error calculating polygon area:", error);
    return 0;
  }
}

function calculatePolygonAreaWithProjection(coordinates: number[][]): number {
  if (coordinates.length < 3) return 0;

  // Calculate centroid for average latitude
  const avgLat =
    coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
  const latRadians = (avgLat * Math.PI) / 180;

  // Web Mercator correction factor
  const metersPerDegreeX = 111000 * Math.cos(latRadians);
  const metersPerDegreeY = 111000;

  // Convert coordinates to meters relative to first point
  const firstCoord = coordinates[0];
  const projectedCoords = coordinates.map((coord) => [
    (coord[0] - firstCoord[0]) * metersPerDegreeX,
    (coord[1] - firstCoord[1]) * metersPerDegreeY,
  ]);

  // Shoelace formula in meters
  let area = 0;
  const n = projectedCoords.length;

  for (let i = 0; i < n - 1; i++) {
    const j = (i + 1) % n;
    area += projectedCoords[i][0] * projectedCoords[j][1];
    area -= projectedCoords[j][0] * projectedCoords[i][1];
  }

  return Math.abs(area) / 2;
}

/**
 * Validate GeoJSON for measurement operations
 */
export function validateGeoJSONForMeasurement(geojson: any): {
  valid: boolean;
  error?: string;
} {
  if (!geojson) {
    return { valid: false, error: "GeoJSON data is null or undefined" };
  }

  if (geojson.type === "FeatureCollection") {
    if (!geojson.features || geojson.features.length === 0) {
      return { valid: false, error: "FeatureCollection is empty" };
    }

    const hasValidGeometry = geojson.features.some((feature: any) => {
      return (
        feature.geometry &&
        (feature.geometry.type === "Polygon" ||
          feature.geometry.type === "MultiPolygon")
      );
    });

    if (!hasValidGeometry) {
      return {
        valid: false,
        error: "FeatureCollection contains no Polygon or MultiPolygon features",
      };
    }

    return { valid: true };
  } else if (geojson.type === "Feature") {
    if (!geojson.geometry) {
      return { valid: false, error: "Feature has no geometry" };
    }

    const allowedTypes = ["Polygon", "MultiPolygon"];
    if (!allowedTypes.includes(geojson.geometry.type)) {
      return {
        valid: false,
        error: `Feature geometry must be Polygon or MultiPolygon, but found ${geojson.geometry.type}`,
      };
    }

    return { valid: true };
  } else if (geojson.type === "Polygon" || geojson.type === "MultiPolygon") {
    return { valid: true };
  } else {
    return {
      valid: false,
      error: `Unsupported GeoJSON type: ${geojson.type}. Must be Polygon, MultiPolygon, Feature, or FeatureCollection`,
    };
  }
}

// ============================================================
// SPATIAL FILTERING (OPTIMIZED)
// ============================================================

interface Point {
  x: number;
  y: number;
  lulcClass: number;
  carbonStock: number;
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function createBoundingBox(coordinates: number[][]): BoundingBox {
  const lngs = coordinates.map((coord) => coord[0]);
  const lats = coordinates.map((coord) => coord[1]);

  return {
    minX: Math.min(...lngs),
    minY: Math.min(...lats),
    maxX: Math.max(...lngs),
    maxY: Math.max(...lats),
  };
}

function isPointInBounds(point: Point, bounds: BoundingBox): boolean {
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  );
}

/**
 * Optimized spatial filtering using bounding box pre-filtering
 */
export function filterByPolygonOptimized(
  data: Array<{ x: number; y: number; lulcClass: number; carbonStock: number }>,
  geojsonGeometry: any,
): Array<{ x: number; y: number; lulcClass: number; carbonStock: number }> {
  const allCoordinates = extractPolygonCoordinates(geojsonGeometry);
  const result: Point[] = [];

  // Create bounding boxes for all polygons
  const polygonBounds = allCoordinates.map((coords) => ({
    coordinates: coords,
    bounds: createBoundingBox(coords),
  }));

  // Overall bounding box
  const overallBounds = {
    minX: Math.min(...polygonBounds.map((p) => p.bounds.minX)),
    minY: Math.min(...polygonBounds.map((p) => p.bounds.minY)),
    maxX: Math.max(...polygonBounds.map((p) => p.bounds.maxX)),
    maxY: Math.max(...polygonBounds.map((p) => p.bounds.maxY)),
  };

  // Pre-filter using overall bounding box
  const candidatePoints = data.filter((point) =>
    isPointInBounds(point, overallBounds),
  );

  // Test each candidate point against polygons
  for (const point of candidatePoints) {
    // Test against polygon bounding boxes first
    const candidatePolygons = polygonBounds.filter((poly) =>
      isPointInBounds(point, poly.bounds),
    );

    // Precise point-in-polygon test
    const isInside = candidatePolygons.some((poly) =>
      isPointInPolygon([point.x, point.y], poly.coordinates),
    );

    if (isInside) {
      result.push(point);
    }
  }

  return result;
}

// ============================================================
// CONTEXT DATA RETRIEVAL
// ============================================================

/**
 * Get GeoJSON content from attachment (handles file storage)
 */
function getGeoJSONContent(attachment: GeoJSONAttachment): any | null {
  try {
    if (
      attachment.content &&
      attachment.content !== "[HIDDEN]" &&
      attachment.content !== "[STORED]"
    ) {
      return JSON.parse(attachment.content);
    }

    if (attachment.fileStored && attachment.name) {
      const storedContent = getFile(attachment.name);
      if (storedContent) {
        return JSON.parse(storedContent);
      }
    }

    if (attachment.parsedGeoJSON) {
      return attachment.parsedGeoJSON;
    }

    return null;
  } catch (error) {
    console.error(
      `Error parsing GeoJSON content for ${attachment.name}:`,
      error,
    );
    return null;
  }
}

/**
 * Get feature count from GeoJSON
 */
function getFeatureCount(geojson: any): number {
  if (!geojson) return 0;

  if (geojson.type === "FeatureCollection") {
    return geojson.features?.length || 0;
  } else if (geojson.type === "Feature") {
    return 1;
  } else {
    return 1;
  }
}

/**
 * Extract timestamp from ULID
 */
function extractTimestampFromULID(ulid: string): number {
  if (!ulid || ulid.length < 10) return 0;

  try {
    const timestampPart = ulid.substring(0, 10);
    const timestamp = parseInt(timestampPart, 36);
    return timestamp;
  } catch (error) {
    return 0;
  }
}

/**
 * Get latest GeoJSON from chat context
 */
export function getLatestGeoJSONFromContext(chatId: string): any | null {
  const messages = chatDB.get(chatId) as MessageWithAttachments[];
  if (!messages) return null;

  let latestGeoJSON = null;
  let latestTimestamp = 0;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];

    // Check attachments
    if (message.attachments) {
      for (const attachment of message.attachments) {
        if (attachment.type === "geojson") {
          const messageTimestamp =
            message.timestamp || extractTimestampFromULID(attachment.id);

          if (messageTimestamp > latestTimestamp) {
            latestTimestamp = messageTimestamp;
            const geojsonContent = getGeoJSONContent(
              attachment as GeoJSONAttachment,
            );
            if (geojsonContent) {
              latestGeoJSON = geojsonContent;
            }
          }
        }
      }
    }

    // Check processed parts
    if (message.parts) {
      for (const part of message.parts) {
        if (
          part.type === "text" &&
          "data" in part &&
          (part as any).data &&
          (part as any).data.type === "data-maps-geojson" &&
          (part as any).data.data &&
          (part as any).data.data.state === "completed" &&
          (part as any).data.data.geojson
        ) {
          const toolResult = part as any;
          const messageTimestamp =
            message.timestamp || extractTimestampFromULID(toolResult.data.id);

          if (messageTimestamp > latestTimestamp) {
            latestTimestamp = messageTimestamp;
            latestGeoJSON = toolResult.data.data.geojson;
          }
        }
      }
    }
  }

  return latestGeoJSON;
}

/**
 * Smart GeoJSON search with fallback strategies
 */
export function getGeoJSONSmartSearch(
  chatId: string,
  identifier?: string,
): any | null {
  if (!identifier || identifier === "latest") {
    return getLatestGeoJSONFromContext(chatId);
  }

  const messages = chatDB.get(chatId) as MessageWithAttachments[];
  if (!messages) return null;

  // Try exact match first
  for (const message of messages) {
    if (message.attachments) {
      for (const attachment of message.attachments) {
        if (attachment.type === "geojson") {
          const geojsonAttachment = attachment as GeoJSONAttachment;

          if (
            geojsonAttachment.id === identifier ||
            geojsonAttachment.name === identifier ||
            geojsonAttachment.name.replace(".geojson", "") === identifier
          ) {
            return getGeoJSONContent(geojsonAttachment);
          }
        }
      }
    }
  }

  // Fallback to latest
  return getLatestGeoJSONFromContext(chatId);
}

/**
 * List available GeoJSON layers
 */
export function listAvailableGeoJSONLayers(
  chatId: string,
): AvailableGeoJSONLayer[] {
  const availableLayers: AvailableGeoJSONLayer[] = [];
  const messages = chatDB.get(chatId) as MessageWithAttachments[];

  if (!messages) return [];

  for (const message of messages) {
    if (message.attachments) {
      for (const attachment of message.attachments) {
        if (attachment.type === "geojson") {
          const geojsonAttachment = attachment as GeoJSONAttachment;

          if (
            !availableLayers.find((layer) => layer.id === geojsonAttachment.id)
          ) {
            let featureCount = 0;
            let source: "attachment" | "processed" | "stored" = "attachment";

            if (geojsonAttachment.metadata?.featureCount) {
              featureCount = geojsonAttachment.metadata.featureCount;
            } else {
              const geojsonContent = getGeoJSONContent(geojsonAttachment);
              if (geojsonContent) {
                featureCount = getFeatureCount(geojsonContent);
              }
            }

            if (geojsonAttachment.fileStored || !geojsonAttachment.content) {
              source = "stored";
            }

            availableLayers.push({
              id: geojsonAttachment.id,
              name:
                geojsonAttachment.name ||
                `GeoJSON Attachment ${geojsonAttachment.id}`,
              featureCount: featureCount,
              timestamp:
                message.timestamp ||
                extractTimestampFromULID(geojsonAttachment.id),
              source: source,
              attachmentName: geojsonAttachment.name,
            });
          }
        }
      }
    }
  }

  return availableLayers.sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
  );
}

// ============================================================
// ANALYSIS DATA RETRIEVAL
// ============================================================

// Fixed findCarbonStockAnalysis function
export function findCarbonStockAnalysis(
  chatId: string,
  analysisId?: string | null,
): any | null {
  const messages = chatDB.get(chatId) as MessageWithAttachments[];
  if (!messages) return null;

  console.log(`🔍 Searching for carbon stock analysis in chat ${chatId}`);
  console.log(`📊 Total messages to search: ${messages.length}`);

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];

    if (message.parts) {
      for (const part of message.parts) {
        // Debug logging
        console.log(`🔸 Checking part type: ${part.type}`);

        // Check for direct data-analyze-carbon-stock parts
        if (part.type === "data-analyze-carbon-stock" && "data" in part) {
          const partData = (part as any).data;
          console.log(
            `✅ Found data-analyze-carbon-stock part:`,
            partData?.name,
          );

          if (
            partData &&
            partData.state === "completed" &&
            (partData.baselineYear !== undefined ||
              partData.yearlyResults !== undefined ||
              partData.metrics !== undefined ||
              partData.measurementArea !== undefined)
          ) {
            if (analysisId && partData.id !== analysisId) {
              console.log(
                `⏭️ Skipping analysis ${partData.id}, looking for ${analysisId}`,
              );
              continue;
            }

            console.log(`🎯 Found matching carbon stock analysis!`);
            return partData;
          }
        }

        // Check for tool result parts (alternative format)
        if (part.type === "text" && "data" in part) {
          const partData = (part as any).data;

          if (
            partData &&
            partData.type === "data-analyze-carbon-stock" &&
            partData.data &&
            partData.data.state === "completed"
          ) {
            console.log(
              `✅ Found tool result carbon stock analysis:`,
              partData.data?.name,
            );

            if (analysisId && partData.id !== analysisId) {
              console.log(
                `⏭️ Skipping tool result ${partData.id}, looking for ${analysisId}`,
              );
              continue;
            }

            console.log(`🎯 Found matching tool result carbon stock analysis!`);
            return partData.data;
          }
        }

        // ADDITIONAL: Check for tool-analyze-carbon-stock results
        if (part.type === "tool-analyze-carbon-stock" && "output" in part) {
          console.log(`🔧 Found tool-analyze-carbon-stock part`);

          // Look for corresponding data part in same message
          const dataPartInSameMessage = message.parts.find(
            (p) =>
              p.type === "data-analyze-carbon-stock" ||
              (p.type === "text" &&
                (p as any).data?.type === "data-analyze-carbon-stock"),
          );

          if (dataPartInSameMessage) {
            console.log(`🔗 Found corresponding data part for tool result`);
            const dataPart = dataPartInSameMessage as any;
            const analysisData = dataPart.data || dataPart;

            if (analysisData && analysisData.state === "completed") {
              console.log(`🎯 Using data from corresponding data part`);
              return analysisData;
            }
          }
        }
      }
    }
  }

  console.log(`❌ No carbon stock analysis found in chat ${chatId}`);
  return null;
}

// Alternative finder that searches more broadly
export function findLatestCarbonStockAnalysis(chatId: string): any | null {
  const messages = chatDB.get(chatId) as MessageWithAttachments[];
  if (!messages) return null;

  console.log(`🔍 Broad search for ANY carbon stock data in chat ${chatId}`);

  // Search through all messages for any carbon stock related data
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];

    if (message.parts) {
      for (const part of message.parts) {
        // Cast to any to access all properties
        const anyPart = part as any;

        // Check if this part contains carbon stock analysis data
        if (
          anyPart.data &&
          (anyPart.data.baselineYear !== undefined ||
            anyPart.data.yearlyResults !== undefined ||
            anyPart.data.summaryMetrics !== undefined ||
            anyPart.data.timeSeriesData !== undefined)
        ) {
          console.log(`🎯 Found carbon stock data in part type: ${part.type}`);
          console.log(`📋 Data keys:`, Object.keys(anyPart.data));

          return anyPart.data;
        }

        // Check nested data
        if (
          anyPart.data?.data &&
          (anyPart.data.data.baselineYear !== undefined ||
            anyPart.data.data.yearlyResults !== undefined ||
            anyPart.data.data.summaryMetrics !== undefined)
        ) {
          console.log(`🎯 Found nested carbon stock data`);
          return anyPart.data.data;
        }
      }
    }
  }

  console.log(`❌ No carbon stock data found in broad search`);
  return null;
}

// Debug function to list all available data
export function debugListAllCarbonData(chatId: string): void {
  const messages = chatDB.get(chatId) as MessageWithAttachments[];
  if (!messages) {
    console.log(`❌ No messages found for chat ${chatId}`);
    return;
  }

  console.log(`🔍 DEBUG: Listing all carbon-related data in chat ${chatId}`);
  console.log(`📊 Total messages: ${messages.length}`);

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    if (message.parts) {
      for (let j = 0; j < message.parts.length; j++) {
        const part = message.parts[j];
        const anyPart = part as any;

        // Log all part types that might contain carbon data
        if (
          part.type.includes("carbon") ||
          part.type.includes("analyze") ||
          part.type.includes("data-") ||
          anyPart.data
        ) {
          console.log(`📋 Message ${i}, Part ${j}:`);
          console.log(`   Type: ${part.type}`);
          console.log(`   Has data:`, !!anyPart.data);

          if (anyPart.data) {
            console.log(`   Data keys:`, Object.keys(anyPart.data));
            console.log(`   Data type:`, anyPart.data.type);
            console.log(`   Data state:`, anyPart.data.state);
            console.log(`   Data name:`, anyPart.data.name);

            // Check for carbon-specific properties
            if (
              anyPart.data.baselineYear ||
              anyPart.data.yearlyResults ||
              anyPart.data.summaryMetrics
            ) {
              console.log(`   🎯 CONTAINS CARBON STOCK DATA!`);
              console.log(`   Baseline year:`, anyPart.data.baselineYear);
              console.log(`   Yearly results:`, !!anyPart.data.yearlyResults);
              console.log(`   Summary metrics:`, !!anyPart.data.summaryMetrics);
            }
          }
        }
      }
    }
  }
}

/**
 * Enhanced LCAM extraction finder with better error handling and logging
 */
export function findLCAMExtraction(
  chatId: string,
  documentId?: string | null,
): any | null {
  const messages = chatDB.get(chatId) as MessageWithAttachments[];
  if (!messages) {
    console.log(`❌ No messages found for chat ${chatId}`);
    return null;
  }

  console.log(`🔍 Searching for LCAM extraction in chat ${chatId}`);
  console.log(`📊 Total messages to search: ${messages.length}`);
  console.log(`🎯 Looking for documentId: ${documentId || "latest"}`);

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    console.log(`📋 Checking message ${i}`);

    if (message.parts) {
      for (let j = 0; j < message.parts.length; j++) {
        const part = message.parts[j];
        console.log(`🔸 Checking part ${j} type: ${part.type}`);

        // Method 1: Direct data-document-lcam-processing part
        if (part.type === "data-document-lcam-processing") {
          console.log(`✅ Found direct LCAM processing part`);

          if ("data" in part && (part as any).data) {
            const partData = (part as any).data;
            console.log(`📋 Part data state: ${partData.state}`);
            console.log(`📋 Part data keys:`, Object.keys(partData));

            if (partData.state === "completed") {
              console.log(`✅ LCAM processing completed`);

              if (documentId && partData.documentId !== documentId) {
                console.log(
                  `⏭️ Skipping document ${partData.documentId}, looking for ${documentId}`,
                );
                continue;
              }

              console.log(`🎯 Found matching LCAM extraction!`);
              return partData;
            }
          }
        }

        // Method 2: Tool result format (text part with nested data)
        if (part.type === "text" && "data" in part) {
          const partData = (part as any).data;
          console.log(`🔧 Checking text part with data`);

          if (
            partData &&
            partData.type === "data-document-lcam-processing" &&
            partData.data &&
            partData.data.state === "completed"
          ) {
            console.log(`✅ Found tool result LCAM processing`);
            console.log(
              `📋 Extracted data available:`,
              !!partData.data.extractedData,
            );

            if (documentId && partData.data.documentId !== documentId) {
              console.log(
                `⏭️ Skipping tool result document ${partData.data.documentId}, looking for ${documentId}`,
              );
              continue;
            }

            console.log(`🎯 Found matching tool result LCAM extraction!`);
            return partData.data;
          }
        }

        // Method 3: Alternative structure check - sometimes data is nested differently
        if ("data" in part) {
          const anyPart = part as any;

          // Check if this contains LCAM-like data
          if (
            anyPart.data &&
            (anyPart.data.extractedData ||
              anyPart.data.informasi_umum ||
              anyPart.data.penilaian_lcam ||
              anyPart.data.lembaga_verifikasi)
          ) {
            console.log(`🔍 Found part with LCAM-like data structure`);
            console.log(`📋 Data keys:`, Object.keys(anyPart.data));

            if (
              anyPart.data.state === "completed" ||
              anyPart.data.extractedData
            ) {
              console.log(`🎯 Using LCAM-like data structure`);
              return anyPart.data;
            }
          }
        }

        // Method 4: Check for tool-upload-lcam-pdf results
        if (part.type === "tool-upload-lcam-pdf" && "output" in part) {
          console.log(`🔧 Found tool-upload-lcam-pdf part`);

          // Look for corresponding data part in same message
          const dataPartInSameMessage = message.parts.find(
            (p) =>
              p.type === "data-document-lcam-processing" ||
              (p.type === "text" &&
                (p as any).data?.type === "data-document-lcam-processing"),
          );

          if (dataPartInSameMessage) {
            console.log(
              `🔗 Found corresponding LCAM data part for tool result`,
            );
            const dataPart = dataPartInSameMessage as any;
            const extractionData = dataPart.data || dataPart;

            if (
              extractionData &&
              (extractionData.state === "completed" ||
                extractionData.extractedData)
            ) {
              console.log(`🎯 Using data from corresponding LCAM data part`);
              return extractionData;
            }
          }
        }
      }
    }
  }

  console.log(`❌ No LCAM extraction found in chat ${chatId}`);
  return null;
}

/**
 * Debug function to list all LCAM-related data
 */
export function debugListAllLCAMData(chatId: string): void {
  const messages = chatDB.get(chatId) as MessageWithAttachments[];
  if (!messages) {
    console.log(`❌ No messages found for chat ${chatId}`);
    return;
  }

  console.log(`🔍 DEBUG: Listing all LCAM-related data in chat ${chatId}`);
  console.log(`📊 Total messages: ${messages.length}`);

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    if (message.parts) {
      for (let j = 0; j < message.parts.length; j++) {
        const part = message.parts[j];
        const anyPart = part as any;

        // Log all part types that might contain LCAM data
        if (
          part.type.includes("lcam") ||
          part.type.includes("document") ||
          part.type.includes("upload") ||
          part.type.includes("data-") ||
          anyPart.data
        ) {
          console.log(`📋 Message ${i}, Part ${j}:`);
          console.log(`   Type: ${part.type}`);
          console.log(`   Has data:`, !!anyPart.data);

          if (anyPart.data) {
            console.log(`   Data keys:`, Object.keys(anyPart.data));
            console.log(`   Data type:`, anyPart.data.type);
            console.log(`   Data state:`, anyPart.data.state);
            console.log(`   Data name:`, anyPart.data.name);

            // Check for LCAM-specific properties
            if (
              anyPart.data.extractedData ||
              anyPart.data.informasi_umum ||
              anyPart.data.penilaian_lcam
            ) {
              console.log(`   🎯 CONTAINS LCAM DATA!`);
              console.log(`   Extracted data:`, !!anyPart.data.extractedData);
              console.log(`   Informasi umum:`, !!anyPart.data.informasi_umum);
              console.log(`   Penilaian LCAM:`, !!anyPart.data.penilaian_lcam);
            }

            // Check nested data
            if (anyPart.data.data) {
              console.log(
                `   Nested data keys:`,
                Object.keys(anyPart.data.data),
              );
              console.log(`   Nested state:`, anyPart.data.data.state);

              if (
                anyPart.data.data.extractedData ||
                anyPart.data.data.informasi_umum
              ) {
                console.log(`   🎯 CONTAINS NESTED LCAM DATA!`);
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Find comparison data from context
 */
export function findComparisonData(
  chatId: string,
  comparisonId?: string | null,
): any | null {
  const messages = chatDB.get(chatId) as MessageWithAttachments[];
  if (!messages) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.parts) {
      for (const part of message.parts) {
        if (part.type === "data-compare-carbon-credits") {
          if ("data" in part && (part as any).data) {
            const partData = (part as any).data;

            if (partData.state === "completed") {
              if (comparisonId && partData.id !== comparisonId) {
                continue;
              }
              return partData;
            }
          }
        }

        if (
          part.type === "text" &&
          "data" in part &&
          (part as any).data &&
          (part as any).data.type === "data-compare-carbon-credits" &&
          (part as any).data.data &&
          (part as any).data.data.state === "completed"
        ) {
          const comparisonData = (part as any).data;

          if (comparisonId && comparisonData.id !== comparisonId) {
            continue;
          }

          return comparisonData.data;
        }
      }
    }
  }

  return null;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Calculate discrepancy between two values
 */
export function calculateDiscrepancy(
  value1: number,
  value2: number,
): {
  absolute: number;
  percentage: number;
  type: "overestimate" | "underestimate" | "matched";
} {
  const absolute = Math.abs(value1 - value2);
  const percentage = value2 !== 0 ? ((value1 - value2) / value2) * 100 : 0;

  let type: "overestimate" | "underestimate" | "matched";
  if (Math.abs(percentage) < 1) {
    type = "matched";
  } else if (value1 > value2) {
    type = "overestimate";
  } else {
    type = "underestimate";
  }

  return { absolute, percentage, type };
}

/**
 * Calculate trend from time series data
 */
export function calculateTrend(
  timeSeriesData: Array<{ year: number; value: number }>,
): "accelerating" | "decelerating" | "stable" | "insufficient_data" {
  if (timeSeriesData.length < 2) return "insufficient_data";

  const firstHalf = timeSeriesData.slice(
    0,
    Math.floor(timeSeriesData.length / 2),
  );
  const secondHalf = timeSeriesData.slice(
    Math.floor(timeSeriesData.length / 2),
  );

  const firstHalfAvg =
    firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

  if (secondHalfAvg > firstHalfAvg * 1.1) return "accelerating";
  if (secondHalfAvg < firstHalfAvg * 0.9) return "decelerating";
  return "stable";
}

// ============================================================
// REPORT GENERATION UTILITIES
// ============================================================

/**
 * Match periods and years between carbon stock and LCAM data
 */
export function matchPeriodsAndYears(
  carbonStockData: any,
  lcamData: any,
): Array<{
  year: number;
  period?: string;
  carbonStock: {
    minMarketableCredits: number;
    maxMarketableCredits: number;
    netSequestration: number;
    forestGrowth: number;
  };
  lcam: {
    pengurangan_emisi_grk: number;
    emisi_baseline?: number;
    emisi_aksi_mitigasi?: number;
    kebocoran_leakage?: number;
  };
}> {
  const matchedData: any[] = [];

  const timeSeriesData = carbonStockData.timeSeriesData || [];
  const lcamPeriodes =
    lcamData.extractedData?.penilaian_lcam?.ringkasan_kuantifikasi
      ?.periode_laporan || [];

  const extractYearFromPeriod = (periode: string): number | null => {
    const match = periode.match(
      /\[(\d{2}\/\d{2}\/(\d{4}))\](?!.*\[\d{2}\/\d{2}\/\d{4}\])/,
    );
    return match ? parseInt(match[2], 10) : null;
  };

  timeSeriesData.forEach((carbonYear: any) => {
    const matchingLcamPeriod = lcamPeriodes.find((lcamPeriod: any) => {
      if (lcamPeriod.tahun === carbonYear.year) {
        return true;
      }

      const extractedYear = extractYearFromPeriod(lcamPeriod.periode);
      return extractedYear === carbonYear.year;
    });

    if (matchingLcamPeriod) {
      matchedData.push({
        year: carbonYear.year,
        period: matchingLcamPeriod.periode,
        carbonStock: {
          minMarketableCredits: carbonYear.minMarketableCredits,
          maxMarketableCredits: carbonYear.maxMarketableCredits,
          netSequestration: carbonYear.netSequestration,
          forestGrowth: carbonYear.forestGrowth,
        },
        lcam: {
          pengurangan_emisi_grk: matchingLcamPeriod.pengurangan_emisi_grk,
          emisi_baseline: matchingLcamPeriod.emisi_baseline,
          emisi_aksi_mitigasi: matchingLcamPeriod.emisi_aksi_mitigasi,
          kebocoran_leakage: matchingLcamPeriod.kebocoran_leakage,
        },
      });
    }
  });

  return matchedData.sort((a, b) => a.year - b.year);
}

/**
 * Generate land use change analysis table
 */
export function generateLandUseChangeTable(carbonData: any): {
  summary: string;
  tableData: Array<{
    lulcClass: string;
    className: string;
    [key: string]: string;
    totalChange: string;
    changePercent: string;
    trend: string;
  }>;
  yearlyTotals: {
    [year: string]: {
      totalArea: number;
      totalPixels: number;
      dominantClass: string;
    };
  };
  availableYears: string[];
} {
  if (!carbonData.baselineStats || !carbonData.yearlyResults) {
    return {
      summary: "Data LULC area change tidak tersedia.",
      tableData: [],
      yearlyTotals: {},
      availableYears: [],
    };
  }

  const baselineYear = carbonData.baselineYear;
  const availableYears = Object.keys(carbonData.yearlyResults).sort();
  const allYears = [baselineYear.toString(), ...availableYears];

  const allLulcClasses = new Set<string>();

  if (carbonData.baselineStats.carbonByClass) {
    Object.keys(carbonData.baselineStats.carbonByClass).forEach((classId) => {
      allLulcClasses.add(classId);
    });
  }

  Object.values(carbonData.yearlyResults).forEach((yearData: any) => {
    if (yearData.stats?.carbonByClass) {
      Object.keys(yearData.stats.carbonByClass).forEach((classId) => {
        allLulcClasses.add(classId);
      });
    }
  });

  const tableData = Array.from(allLulcClasses)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map((classId) => {
      const className = LULC_LABELS[parseInt(classId)] || `Class ${classId}`;

      const row: any = {
        lulcClass: classId,
        className: className,
      };

      const baselineData =
        carbonData.baselineStats.carbonByClass[parseInt(classId)];
      const baselinePixels = baselineData?.count || 0;
      const baselineArea = baselinePixels * 0.01;
      row[`baseline${baselineYear}`] =
        `${baselineArea.toFixed(2)} ha (${baselinePixels.toLocaleString()} px)`;

      let latestPixels = baselinePixels;
      availableYears.forEach((year) => {
        const yearData = carbonData.yearlyResults[year];
        const classData = yearData?.stats?.carbonByClass?.[parseInt(classId)];
        const pixels = classData?.count || 0;
        const area = pixels * 0.01;

        row[`year${year}`] =
          `${area.toFixed(2)} ha (${pixels.toLocaleString()} px)`;

        if (year === availableYears[availableYears.length - 1]) {
          latestPixels = pixels;
        }
      });

      const totalChangePixels = latestPixels - baselinePixels;
      const totalChangeArea = totalChangePixels * 0.01;
      const changePercent =
        baselinePixels > 0 ? (totalChangePixels / baselinePixels) * 100 : 0;

      row.totalChange = `${totalChangeArea > 0 ? "+" : ""}${totalChangeArea.toFixed(2)} ha`;
      row.changePercent = `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`;

      let trend = "Stable";
      if (Math.abs(changePercent) > 10) {
        trend =
          changePercent > 0 ? "Significant Increase" : "Significant Decrease";
      } else if (Math.abs(changePercent) > 2) {
        trend = changePercent > 0 ? "Moderate Increase" : "Moderate Decrease";
      }
      row.trend = trend;

      return row;
    });

  const yearlyTotals: any = {};

  const baselineTotalPixels = Object.values(
    carbonData.baselineStats.carbonByClass,
  ).reduce((sum: number, classData: any) => sum + classData.count, 0);
  const baselineDominantClass = Object.entries(
    carbonData.baselineStats.carbonByClass,
  ).reduce(
    (max: any, [classId, classData]: [string, any]) =>
      classData.count > max.count ? { classId, count: classData.count } : max,
    { classId: "0", count: 0 },
  );

  yearlyTotals[`baseline${baselineYear}`] = {
    totalArea: baselineTotalPixels * 0.01,
    totalPixels: baselineTotalPixels,
    dominantClass:
      LULC_LABELS[parseInt(baselineDominantClass.classId)] ||
      `Class ${baselineDominantClass.classId}`,
  };

  availableYears.forEach((year) => {
    const yearData = carbonData.yearlyResults[year];
    if (yearData?.stats?.carbonByClass) {
      const totalPixels = Object.values(yearData.stats.carbonByClass).reduce(
        (sum: number, classData: any) => sum + classData.count,
        0,
      );

      const dominantClass = Object.entries(yearData.stats.carbonByClass).reduce(
        (max: any, [classId, classData]: [string, any]) =>
          classData.count > max.count
            ? { classId, count: classData.count }
            : max,
        { classId: "0", count: 0 },
      );

      yearlyTotals[`year${year}`] = {
        totalArea: totalPixels * 0.01,
        totalPixels: totalPixels,
        dominantClass:
          LULC_LABELS[parseInt(dominantClass.classId)] ||
          `Class ${dominantClass.classId}`,
      };
    }
  });

  const summary = `Analisis Perubahan Penggunaan Lahan (LULC) menggunakan Carbon Sensing AI:

**Periode Analisis:** ${baselineYear} (baseline) hingga ${availableYears[availableYears.length - 1]}
**Total Classes Detected:** ${allLulcClasses.size} kelas LULC
**Measurement Method:** Remote sensing pixel count analysis (0.01 ha per pixel)
**Total Years:** ${allYears.length} tahun data

**Area Changes Summary:**
- Baseline Total Area: ${yearlyTotals[`baseline${baselineYear}`]?.totalArea.toFixed(2)} ha
- Latest Total Area: ${yearlyTotals[`year${availableYears[availableYears.length - 1]}`]?.totalArea.toFixed(2)} ha
- Dominant Class (Baseline): ${yearlyTotals[`baseline${baselineYear}`]?.dominantClass}
- Dominant Class (Latest): ${yearlyTotals[`year${availableYears[availableYears.length - 1]}`]?.dominantClass}

Tabel menampilkan perubahan luas area per kelas penggunaan lahan dari tahun baseline hingga tahun analisis terbaru.`;

  return {
    summary,
    tableData,
    yearlyTotals,
    availableYears: allYears,
  };
}

/**
 * Generate carbon pool analysis table data
 */
export function generateCarbonPoolTable(carbonData: any): {
  summary: string;
  tableData: Array<{
    year: string;
    carbonStocks: string;
    forestGrowth: string;
    netSequestration: string;
    leakage: string;
    minMarketableCredits: string;
    maxMarketableCredits: string;
    carbonStockChange: string;
    sequestrationRate: string;
    trend: string;
  }>;
  totals: {
    totalCarbonStocks: number;
    totalForestGrowth: number;
    totalNetSequestration: number;
    totalLeakage: number;
    averageSequestrationRate: number;
  };
  availableYears: string[];
} {
  if (!carbonData.yearlyResults) {
    return {
      summary: "Data analisis carbon pool tidak tersedia.",
      tableData: [],
      totals: {
        totalCarbonStocks: 0,
        totalForestGrowth: 0,
        totalNetSequestration: 0,
        totalLeakage: 0,
        averageSequestrationRate: 0,
      },
      availableYears: [],
    };
  }

  const availableYears = Object.keys(carbonData.yearlyResults).sort();

  const yearlyData = availableYears.map((year) => {
    const data = carbonData.yearlyResults[year];
    const metrics = data.metrics || {};

    return {
      year: parseInt(year),
      carbonStocks: metrics.carbonStocks || 0,
      forestGrowth: metrics.forestGrowth || 0,
      netSequestration: metrics.netSequestration || 0,
      leakage: metrics.leakage || 0,
      minMarketableCredits: metrics.minMarketableCredits || 0,
      maxMarketableCredits: metrics.maxMarketableCredits || 0,
    };
  });

  // Calculate totals
  const totals = {
    totalCarbonStocks: yearlyData.reduce(
      (sum, data) => sum + data.carbonStocks,
      0,
    ),
    totalForestGrowth: yearlyData.reduce(
      (sum, data) => sum + data.forestGrowth,
      0,
    ),
    totalNetSequestration: yearlyData.reduce(
      (sum, data) => sum + data.netSequestration,
      0,
    ),
    totalLeakage: yearlyData.reduce((sum, data) => sum + data.leakage, 0),
    averageSequestrationRate: 0,
  };

  totals.averageSequestrationRate =
    yearlyData.length > 0
      ? totals.totalNetSequestration / yearlyData.length
      : 0;

  const tableData = yearlyData.map((data, index) => {
    // Calculate carbon stock change from previous year
    const prevData = index > 0 ? yearlyData[index - 1] : null;
    const carbonStockChange = prevData
      ? data.carbonStocks - prevData.carbonStocks
      : 0;

    // Calculate sequestration rate (net sequestration / carbon stocks * 100)
    const sequestrationRate =
      data.carbonStocks > 0
        ? (data.netSequestration / data.carbonStocks) * 100
        : 0;

    // Determine trend based on sequestration rate and changes
    let trend = "Stable";
    if (Math.abs(sequestrationRate) > 5) {
      trend = sequestrationRate > 0 ? "High Sequestration" : "Carbon Loss";
    } else if (Math.abs(sequestrationRate) > 2) {
      trend =
        sequestrationRate > 0 ? "Moderate Sequestration" : "Low Performance";
    }

    return {
      year: data.year.toString(),
      carbonStocks: `${data.carbonStocks.toLocaleString()} Mg C`,
      forestGrowth: `${data.forestGrowth.toLocaleString()} Mg C`,
      netSequestration: `${data.netSequestration.toLocaleString()} Mg C`,
      leakage: `${data.leakage.toLocaleString()} Mg C`,
      minMarketableCredits: `${data.minMarketableCredits.toLocaleString()} IDR`,
      maxMarketableCredits: `${data.maxMarketableCredits.toLocaleString()} IDR`,
      carbonStockChange: `${carbonStockChange > 0 ? "+" : ""}${carbonStockChange.toLocaleString()} Mg C`,
      sequestrationRate: `${sequestrationRate.toFixed(2)}%`,
      trend: trend,
    };
  });

  const summary = `Analisis Carbon Pool menggunakan Carbon Sensing AI:

**Periode Analisis:** ${availableYears[0]} hingga ${availableYears[availableYears.length - 1]}
**Total Years Analyzed:** ${availableYears.length} tahun
**Detection Method:** AI-powered remote sensing analysis

**Carbon Pool Summary:**
- Total Carbon Stocks: ${totals.totalCarbonStocks.toLocaleString()} Mg C
- Total Forest Growth: ${totals.totalForestGrowth.toLocaleString()} Mg C
- Total Net Sequestration: ${totals.totalNetSequestration.toLocaleString()} Mg C
- Total Leakage: ${totals.totalLeakage.toLocaleString()} Mg C
- Average Sequestration Rate: ${totals.averageSequestrationRate.toFixed(2)} Mg C/year

Tabel menampilkan dinamika carbon pool per tahun dengan trend analisis kinerja sekuestrasi karbon.`;

  return {
    summary,
    tableData,
    totals,
    availableYears,
  };
}

/**
 * Generate comparison analysis table data
 */
export function generateComparisonTable(
  carbonData: any,
  lcamData: any,
  comparisonData?: any,
): {
  summary: string;
  tableData: Array<{
    year: string;
    lcamEmissionReduction: string;
    carbonSensingNetSequestration: string;
    lcamCarbonStock: string;
    carbonSensingCarbonStock: string;
    absoluteDiscrepancy: string;
    percentageDiscrepancy: string;
    discrepancyType: string;
    agreement: string;
  }>;
  overallMetrics: {
    totalLCAMReduction: number;
    totalCarbonSensingSequestration: number;
    averageDiscrepancy: number;
    correlationScore: string;
    methodAgreement: string;
  };
  availableYears: string[];
} {
  if (!comparisonData && (!carbonData.yearlyResults || !lcamData)) {
    return {
      summary: "Data perbandingan tidak tersedia untuk analisis.",
      tableData: [],
      overallMetrics: {
        totalLCAMReduction: 0,
        totalCarbonSensingSequestration: 0,
        averageDiscrepancy: 0,
        correlationScore: "N/A",
        methodAgreement: "N/A",
      },
      availableYears: [],
    };
  }

  let tableData: any[] = [];
  let availableYears: string[] = [];
  let overallMetrics: any = {};

  if (comparisonData) {
    // Use detailed comparison data if available
    availableYears =
      comparisonData.yearlyComparison?.map((year: any) =>
        year.year.toString(),
      ) || [];

    tableData =
      comparisonData.yearlyComparison?.map((yearData: any) => {
        const discrepancy = yearData.discrepancy.netSequestration;

        // Determine agreement level
        let agreement = "Poor";
        if (Math.abs(discrepancy.percentage) < 10) {
          agreement = "Excellent";
        } else if (Math.abs(discrepancy.percentage) < 20) {
          agreement = "Good";
        } else if (Math.abs(discrepancy.percentage) < 30) {
          agreement = "Fair";
        }

        return {
          year: yearData.year.toString(),
          lcamEmissionReduction: `${(yearData.lcam.pengurangan_emisi_grk || 0).toLocaleString()} ton CO2e`,
          carbonSensingNetSequestration: `${yearData.carbonStock.netSequestration.toLocaleString()} ton CO2e`,
          // lcamCarbonStock: `${(yearData.lcam.carbon_stock || 0).toLocaleString()} ton CO2e`,
          // carbonSensingCarbonStock: `${yearData.carbonStock.carbonStocks.toLocaleString()} Mg C`,
          absoluteDiscrepancy: `${discrepancy.absolute.toLocaleString()} ton CO2e`,
          percentageDiscrepancy: `${discrepancy.percentage.toFixed(1)}%`,
          discrepancyType: discrepancy.type,
          agreement: agreement,
        };
      }) || [];

    overallMetrics = {
      totalLCAMReduction:
        comparisonData.summaryStatistics?.totalLCAMReduction || 0,
      totalCarbonSensingSequestration:
        comparisonData.summaryStatistics?.totalCarbonStockNetSequestration || 0,
      averageDiscrepancy:
        comparisonData.summaryStatistics?.averageDiscrepancyPercentage || 0,
      correlationScore:
        comparisonData.summaryStatistics?.correlationAnalysis
          ?.netSequestrationCorrelation || "N/A",
      methodAgreement:
        comparisonData.qualityAssessment?.methodAgreement || "N/A",
    };
  } else {
    // Generate basic comparison from raw data
    const lcamPeriodes =
      lcamData.extractedData?.penilaian_lcam?.ringkasan_kuantifikasi
        ?.periode_laporan || [];
    const carbonYears = Object.keys(carbonData.yearlyResults || {}).sort();

    availableYears = lcamPeriodes.map((periode: any) =>
      periode.tahun.toString(),
    );

    tableData = lcamPeriodes.map((periode: any) => {
      const year = periode.tahun;
      const lcamValue = periode.pengurangan_emisi_grk || 0;
      const lcamCarbonStock = periode.carbon_stock || 0;

      const carbonYear = carbonData.yearlyResults?.[year];
      const carbonValue = carbonYear?.metrics?.netSequestration || 0;
      const carbonStocks = carbonYear?.metrics?.carbonStocks || 0;

      const absoluteDiscrepancy = Math.abs(lcamValue - carbonValue);
      const percentageDiscrepancy =
        lcamValue > 0 ? (absoluteDiscrepancy / lcamValue) * 100 : 0;

      let agreement = "Poor";
      if (percentageDiscrepancy < 10) {
        agreement = "Excellent";
      } else if (percentageDiscrepancy < 20) {
        agreement = "Good";
      } else if (percentageDiscrepancy < 30) {
        agreement = "Fair";
      }

      const discrepancyType =
        lcamValue > carbonValue ? "LCAM Higher" : "Carbon Sensing Higher";

      return {
        year: year.toString(),
        lcamEmissionReduction: `${lcamValue.toLocaleString()} ton CO2e`,
        carbonSensingNetSequestration: `${carbonValue.toLocaleString()} ton CO2e`,
        lcamCarbonStock: `${lcamCarbonStock.toLocaleString()} ton CO2e`,
        carbonSensingCarbonStock: `${carbonStocks.toLocaleString()} Mg C`,
        absoluteDiscrepancy: `${absoluteDiscrepancy.toLocaleString()} ton CO2e`,
        percentageDiscrepancy: `${percentageDiscrepancy.toFixed(1)}%`,
        discrepancyType: discrepancyType,
        agreement: agreement,
      };
    });

    // Calculate basic overall metrics
    const totalLCAM = lcamPeriodes.reduce(
      (sum: number, periode: any) => sum + (periode.pengurangan_emisi_grk || 0),
      0,
    );
    const totalCarbonSensing = tableData.reduce((sum: number, row: any) => {
      const value = parseFloat(
        row.carbonSensingNetSequestration.replace(/[^\d.-]/g, ""),
      );
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

    const averageDiscrepancy =
      tableData.length > 0
        ? tableData.reduce(
            (sum: number, row: any) =>
              sum + parseFloat(row.percentageDiscrepancy.replace("%", "")),
            0,
          ) / tableData.length
        : 0;

    overallMetrics = {
      totalLCAMReduction: totalLCAM,
      totalCarbonSensingSequestration: totalCarbonSensing,
      averageDiscrepancy: averageDiscrepancy,
      correlationScore: "Not Calculated",
      methodAgreement:
        averageDiscrepancy < 15
          ? "Good"
          : averageDiscrepancy < 25
            ? "Fair"
            : "Poor",
    };
  }

  const summary = `Perbandingan Kuantifikasi Pengurangan Emisi GRK:

**Metode Perbandingan:** LCAM vs Carbon Sensing AI
**Periode Analisis:** ${availableYears[0]} hingga ${availableYears[availableYears.length - 1]}
**Total Years Compared:** ${availableYears.length} tahun

**Overall Comparison Metrics:**
- Total LCAM Reduction: ${overallMetrics.totalLCAMReduction.toLocaleString()} ton CO2e
- Total Carbon Sensing Sequestration: ${overallMetrics.totalCarbonSensingSequestration.toLocaleString()} ton CO2e
- Average Discrepancy: ${overallMetrics.averageDiscrepancy.toFixed(1)}%
- Method Agreement: ${overallMetrics.methodAgreement}
- Correlation Score: ${overallMetrics.correlationScore}

**Assessment Quality:**
- Data Reliability: ${comparisonData?.qualityAssessment?.dataReliability || "Standard"}
- Recommended Approach: ${comparisonData?.qualityAssessment?.recommendedApproach?.replace(/_/g, " ") || "Combined Analysis"}

Tabel menampilkan perbandingan detail antara hasil kuantifikasi LCAM dan Carbon Sensing AI dengan analisis discrepancy dan tingkat agreement.`;

  return {
    summary,
    tableData,
    overallMetrics,
    availableYears,
  };
}
function generateBasicComparison(carbonData: any, lcamData: any): string {
  const lcamPeriodes =
    lcamData.extractedData?.penilaian_lcam?.ringkasan_kuantifikasi
      ?.periode_laporan || [];

  let comparisonTable =
    "| Tahun | LCAM (ton CO2e) | Carbon Sensing AI (ton CO2e) | Status |\n";
  comparisonTable +=
    "|-------|-----------------|------------------------------|--------|\n";

  lcamPeriodes.forEach((periode: any) => {
    const tahun = periode.tahun;
    const lcamValue = periode.pengurangan_emisi_grk || 0;

    const carbonYear = carbonData.timeSeriesData?.find(
      (data: any) => data.year === tahun,
    );
    const carbonValue = carbonYear?.netSequestration || 0;

    const status =
      Math.abs(lcamValue - carbonValue) > lcamValue * 0.2
        ? "❌ Significant Discrepancy"
        : "✅ Reasonable Match";

    comparisonTable += `| ${tahun} | ${lcamValue.toLocaleString()} | ${carbonValue.toLocaleString()} | ${status} |\n`;
  });

  return `**Perbandingan Kuantifikasi Pengurangan Emisi GRK:**

${comparisonTable}

*Note: Perbandingan dasar tanpa analisis statistik mendalam. Gunakan tool compare-marketable-carbon-credits untuk analisis yang lebih komprehensif.*`;
}

/**
 * Risk level assessment
 */
export function calculateOverallRiskLevel(
  carbonData: any,
  lcamData: any,
  comparisonData?: any,
): "HIGH" | "MEDIUM" | "LOW" {
  let riskScore = 0;

  // Data discrepancy risk
  if (
    comparisonData?.totalComparison?.netSequestrationDiscrepancy?.percentage
  ) {
    const discrepancy = Math.abs(
      comparisonData.totalComparison.netSequestrationDiscrepancy.percentage,
    );
    if (discrepancy > 30) riskScore += 3;
    else if (discrepancy > 15) riskScore += 2;
    else if (discrepancy > 5) riskScore += 1;
  }

  // Data quality risk
  const dataReliability = comparisonData?.qualityAssessment?.dataReliability;
  if (dataReliability === "low") riskScore += 2;
  else if (dataReliability === "medium") riskScore += 1;

  // Verification completeness risk
  const verificationBody =
    lcamData.extractedData?.lembaga_verifikasi?.identitas_lembaga?.nama_lembaga;
  if (!verificationBody || verificationBody.includes("Not specified"))
    riskScore += 2;

  // Growth pattern risk
  const avgGrowth = carbonData.summaryMetrics?.averageAnnualGrowth || 0;
  if (avgGrowth < 1000) riskScore += 2;
  else if (avgGrowth > 50000) riskScore += 3;

  if (riskScore >= 5) return "HIGH";
  if (riskScore >= 3) return "MEDIUM";
  return "LOW";
}

/**
 * Count extracted fields from nested object
 */
export function countExtractedFields(obj: any): number {
  let count = 0;

  const countFields = (item: any): void => {
    if (typeof item === "object" && item !== null) {
      if (Array.isArray(item)) {
        item.forEach(countFields);
      } else {
        Object.values(item).forEach((value) => {
          if (
            typeof value === "string" &&
            value.trim() !== "" &&
            value !== "Not specified" &&
            value !== "Not available"
          ) {
            count++;
          } else if (typeof value === "object") {
            countFields(value);
          }
        });
      }
    }
  };

  countFields(obj);
  return count;
}

/**
 * Generate content preview for extracted data
 */
export function generateContentPreview(data: any): string {
  const preview = {
    judul_kegiatan: data.informasi_umum?.judul_kegiatan || "Not specified",
    periode_monitoring:
      data.ringkasan_eksekutif?.periode_laporan_pemantauan || "Not specified",
    lembaga_verifikasi:
      data.lembaga_verifikasi?.identitas_lembaga?.nama_lembaga ||
      "Not specified",
    total_sections: Object.keys(data).length,
  };

  return JSON.stringify(preview, null, 2);
}

/**
 * Calculate bounds for GeoJSON data
 */
export function calculateGeoJSONBounds(
  geojson: any,
): [number, number, number, number] {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;

  function processCoordinates(coords: any) {
    if (typeof coords[0] === "number") {
      minLng = Math.min(minLng, coords[0]);
      maxLng = Math.max(maxLng, coords[0]);
      minLat = Math.min(minLat, coords[1]);
      maxLat = Math.max(maxLat, coords[1]);
    } else {
      coords.forEach(processCoordinates);
    }
  }

  function processGeometry(geometry: any) {
    if (geometry && geometry.coordinates) {
      processCoordinates(geometry.coordinates);
    }
  }

  if (geojson.type === "FeatureCollection") {
    geojson.features.forEach((feature: any) =>
      processGeometry(feature.geometry),
    );
  } else if (geojson.type === "Feature") {
    processGeometry(geojson.geometry);
  } else {
    processGeometry(geojson);
  }

  return [minLng, minLat, maxLng, maxLat];
}
export function calculateCarbonClassChanges(
  baseline: any,
  yearlyResults: Record<number, any>,
): Record<string, any> {
  const changes: Record<string, any> = {};

  Object.entries(yearlyResults).forEach(([year, data]) => {
    const yearChanges: Record<number, any> = {};

    Object.entries(data.stats.carbonByClass).forEach(
      ([classId, classData]: [string, any]) => {
        const classNum = parseInt(classId);
        const baselineClass = baseline.carbonByClass[classNum];

        if (baselineClass) {
          yearChanges[classNum] = {
            countChange: classData.count - baselineClass.count,
            countChangePercent:
              ((classData.count - baselineClass.count) / baselineClass.count) *
              100,
            carbonChange: classData.totalCarbon - baselineClass.totalCarbon,
            carbonChangePercent:
              ((classData.totalCarbon - baselineClass.totalCarbon) /
                baselineClass.totalCarbon) *
              100,
          };
        } else {
          yearChanges[classNum] = {
            countChange: classData.count,
            countChangePercent: 100,
            carbonChange: classData.totalCarbon,
            carbonChangePercent: 100,
          };
        }
      },
    );

    changes[year] = yearChanges;
  });

  return changes;
}
/**
 * Find specific red flag analysis from context
 */
export function findRedFlagAnalysis(
  chatId: string,
  analysisType: string,
  analysisId?: string | null,
): RedFlagAnalysisResult | null {
  const messages = chatDB.get(chatId) as MessageWithAttachments[];
  if (!messages) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.parts) {
      for (const part of message.parts) {
        if (part.type === analysisType && "data" in part) {
          const partData = (part as any).data;

          if (partData && partData.state === "completed") {
            if (analysisId && partData.id !== analysisId) {
              continue;
            }
            return partData;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Extract personnel information from LCAM data
 */
function extractPersonnelFromLCAM(
  lcamData: any,
): Array<{ name: string; role: string; contact?: string }> {
  const personnel = [];

  try {
    const informasiUmum = lcamData?.informasi_umum || {};
    const pemilikKegiatan = informasiUmum?.pemilik_kegiatan || {};

    // Extract key personnel
    if (pemilikKegiatan.project_owner) {
      personnel.push({
        name: pemilikKegiatan.project_owner,
        role: "Project Owner",
        contact: pemilikKegiatan.contact_owner || undefined,
      });
    }

    if (pemilikKegiatan.technical_partner) {
      personnel.push({
        name: pemilikKegiatan.technical_partner,
        role: "Technical Partner / Carbon Manager",
        contact: pemilikKegiatan.contact_technical || undefined,
      });
    }

    if (pemilikKegiatan.community_partner) {
      personnel.push({
        name: pemilikKegiatan.community_partner,
        role: "Community Partner",
        contact: pemilikKegiatan.contact_community || undefined,
      });
    }

    // Extract from verification body if available
    const verifikasi = lcamData?.lembaga_verifikasi?.identitas_lembaga || {};
    if (verifikasi.nama_lembaga) {
      personnel.push({
        name: verifikasi.nama_lembaga,
        role: "Verification Body",
        contact: verifikasi.kontak || undefined,
      });
    }

    // Extract directors/managers if available
    if (informasiUmum.direktur_operasional) {
      personnel.push({
        name: informasiUmum.direktur_operasional,
        role: "Operational Director",
        contact: informasiUmum.kontak_direktur || undefined,
      });
    }
  } catch (error) {
    console.error("Error extracting personnel from LCAM:", error);
  }

  return personnel;
}
/**
 * Calculate overlap between two GeoJSON objects with improved error handling
 */
export function calculateGeoJSONOverlap(
  geojson1: any,
  geojson2: any,
): {
  hasOverlap: boolean;
  overlapArea: number;
  overlapPercentage: number;
} {
  try {
    console.log("GeoJSON1 type:", geojson1?.type);
    console.log("GeoJSON2 type:", geojson2?.type);

    // Validate input data
    if (!geojson1) {
      console.error("GeoJSON1 is null or undefined");
      return { hasOverlap: false, overlapArea: 0, overlapPercentage: 0 };
    }

    if (!geojson2) {
      console.error("GeoJSON2 is null or undefined");
      return { hasOverlap: false, overlapArea: 0, overlapPercentage: 0 };
    }

    // Validate GeoJSON structure
    const validation1 = validateGeoJSONForMeasurement(geojson1);
    const validation2 = validateGeoJSONForMeasurement(geojson2);

    if (!validation1.valid) {
      console.error("GeoJSON1 validation failed:", validation1.error);
      return { hasOverlap: false, overlapArea: 0, overlapPercentage: 0 };
    }

    if (!validation2.valid) {
      console.error("GeoJSON2 validation failed:", validation2.error);
      return { hasOverlap: false, overlapArea: 0, overlapPercentage: 0 };
    }

    // Calculate areas safely
    const area1 = calculatePolygonArea(geojson1);
    const area2 = calculatePolygonArea(geojson2);

    console.log("Area1:", area1, "Area2:", area2);

    if (area1 === 0 || area2 === 0) {
      console.warn("One or both areas are 0");
      return { hasOverlap: false, overlapArea: 0, overlapPercentage: 0 };
    }

    // Calculate bounding boxes
    const bbox1 = calculateGeoJSONBoundsSafe(geojson1);
    const bbox2 = calculateGeoJSONBoundsSafe(geojson2);

    console.log("BBox1:", bbox1, "BBox2:", bbox2);

    // Check if bounding boxes intersect
    const hasOverlap = bboxIntersect(bbox1, bbox2);

    if (!hasOverlap) {
      return { hasOverlap: false, overlapArea: 0, overlapPercentage: 0 };
    }

    // Calculate overlap area (simplified approximation)
    // For a more accurate calculation, you would need a proper GIS library
    const overlapBBox = [
      Math.max(bbox1[0], bbox2[0]), // max minLng
      Math.max(bbox1[1], bbox2[1]), // max minLat
      Math.min(bbox1[2], bbox2[2]), // min maxLng
      Math.min(bbox1[3], bbox2[3]), // min maxLat
    ];

    // Simple overlap area estimation based on bounding box intersection
    const overlapWidth = overlapBBox[2] - overlapBBox[0];
    const overlapHeight = overlapBBox[3] - overlapBBox[1];

    if (overlapWidth <= 0 || overlapHeight <= 0) {
      return { hasOverlap: false, overlapArea: 0, overlapPercentage: 0 };
    }

    // Convert to approximate area in hectares (very rough approximation)
    const avgLat = (overlapBBox[1] + overlapBBox[3]) / 2;
    const latFactor = Math.cos((avgLat * Math.PI) / 180);
    const overlapArea =
      (overlapWidth * overlapHeight * latFactor * 111000 * 111000) / 10000; // Convert to hectares

    // Calculate percentage relative to smaller polygon
    const smallerArea = Math.min(area1, area2);
    const overlapPercentage =
      smallerArea > 0 ? (overlapArea / smallerArea) * 100 : 0;

    return {
      hasOverlap: true,
      overlapArea: Math.max(0, overlapArea),
      overlapPercentage: Math.min(100, Math.max(0, overlapPercentage)),
    };
  } catch (error) {
    console.error("Error calculating GeoJSON overlap:", error);
    return {
      hasOverlap: false,
      overlapArea: 0,
      overlapPercentage: 0,
    };
  }
}

/**
 * Helper function to check if two bounding boxes intersect
 */
function bboxIntersect(
  bbox1: [number, number, number, number],
  bbox2: [number, number, number, number],
): boolean {
  try {
    const [minLng1, minLat1, maxLng1, maxLat1] = bbox1;
    const [minLng2, minLat2, maxLng2, maxLat2] = bbox2;

    // Check if any coordinate is invalid
    if (
      [
        minLng1,
        minLat1,
        maxLng1,
        maxLat1,
        minLng2,
        minLat2,
        maxLng2,
        maxLat2,
      ].some(
        (coord) =>
          !isFinite(coord) || coord === Infinity || coord === -Infinity,
      )
    ) {
      return false;
    }

    return !(
      maxLng1 < minLng2 ||
      maxLng2 < minLng1 ||
      maxLat1 < minLat2 ||
      maxLat2 < minLat1
    );
  } catch (error) {
    console.error("Error checking bbox intersection:", error);
    return false;
  }
}

/**
 * Improved calculatePolygonArea with better error handling
 */
export function calculatePolygonAreaSafe(geojsonGeometry: any): number {
  try {
    // Add null/undefined check first
    if (!geojsonGeometry) {
      console.error("GeoJSON geometry is null or undefined");
      return 0;
    }

    // Add type check
    if (!geojsonGeometry.type) {
      console.error("GeoJSON geometry missing type property");
      return 0;
    }

    const allCoordinates = extractPolygonCoordinates(geojsonGeometry);
    let totalArea = 0;

    for (const coordinates of allCoordinates) {
      if (coordinates && coordinates.length >= 3) {
        const area = calculatePolygonAreaWithProjection(coordinates);
        totalArea += area;
      }
    }

    // Convert to hectares (1 hectare = 10,000 m²)
    return totalArea / 10000;
  } catch (error) {
    console.error("Error calculating polygon area:", error);
    return 0;
  }
}

/**
 * Calculate bounding box for GeoJSON with improved error handling
 */
export function calculateGeoJSONBoundsSafe(
  geojson: any,
): [number, number, number, number] {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;

  try {
    if (!geojson) {
      console.error("GeoJSON is null or undefined for bounds calculation");
      return [0, 0, 0, 0];
    }

    function processCoordinates(coords: any) {
      if (
        Array.isArray(coords) &&
        coords.length >= 2 &&
        typeof coords[0] === "number" &&
        typeof coords[1] === "number"
      ) {
        const [lng, lat] = coords;
        if (isFinite(lng) && isFinite(lat)) {
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      } else if (Array.isArray(coords)) {
        coords.forEach(processCoordinates);
      }
    }

    function processGeometry(geometry: any) {
      if (geometry && geometry.coordinates) {
        processCoordinates(geometry.coordinates);
      }
    }

    if (geojson.type === "FeatureCollection" && geojson.features) {
      geojson.features.forEach((feature: any) => {
        if (feature && feature.geometry) {
          processGeometry(feature.geometry);
        }
      });
    } else if (geojson.type === "Feature" && geojson.geometry) {
      processGeometry(geojson.geometry);
    } else if (geojson.coordinates) {
      processGeometry(geojson);
    }

    // Check if we found valid coordinates
    if (
      minLng === Infinity ||
      minLat === Infinity ||
      maxLng === -Infinity ||
      maxLat === -Infinity
    ) {
      console.warn("No valid coordinates found in GeoJSON");
      return [0, 0, 0, 0];
    }

    return [minLng, minLat, maxLng, maxLat];
  } catch (error) {
    console.error("Error calculating GeoJSON bounds:", error);
    return [0, 0, 0, 0];
  }
}
export function extractPolygonCoordinatesSafe(
  geojsonGeometry: any,
): number[][][] {
  let coordinates: number[][][] = [];

  try {
    if (!geojsonGeometry) {
      throw new Error("GeoJSON geometry is null or undefined");
    }

    if (!geojsonGeometry.type) {
      throw new Error("GeoJSON geometry missing type property");
    }

    if (geojsonGeometry.type === "Polygon") {
      if (geojsonGeometry.coordinates && geojsonGeometry.coordinates[0]) {
        coordinates = [geojsonGeometry.coordinates[0]];
      }
    } else if (geojsonGeometry.type === "MultiPolygon") {
      if (geojsonGeometry.coordinates) {
        coordinates = geojsonGeometry.coordinates.map(
          (polygon: number[][][]) => polygon[0],
        );
      }
    } else if (geojsonGeometry.type === "Feature" && geojsonGeometry.geometry) {
      return extractPolygonCoordinatesSafe(geojsonGeometry.geometry);
    } else if (geojsonGeometry.type === "FeatureCollection") {
      if (geojsonGeometry.features && geojsonGeometry.features.length > 0) {
        for (const feature of geojsonGeometry.features) {
          if (feature.geometry) {
            const featureCoords = extractPolygonCoordinatesSafe(
              feature.geometry,
            );
            coordinates.push(...featureCoords);
          }
        }
      }

      if (coordinates.length === 0) {
        throw new Error(
          "FeatureCollection does not contain any valid Polygon or MultiPolygon features",
        );
      }
    } else {
      throw new Error(
        `Unsupported GeoJSON type: ${geojsonGeometry.type}. Must be Polygon, MultiPolygon, Feature, or FeatureCollection`,
      );
    }

    return coordinates;
  } catch (error) {
    console.error("Error extracting polygon coordinates:", error);
    return [];
  }
}
/**
 * Calculate area of GeoJSON (simplified)
 */
function calculateArea(geojson: any): number {
  try {
    if (!geojson?.features) return 0;

    // Simplified area calculation - would need proper geodesic calculation
    let totalArea = 0;

    for (const feature of geojson.features) {
      if (
        feature.geometry?.type === "Polygon" &&
        feature.geometry.coordinates
      ) {
        // Very simplified area calculation for polygon
        const coords = feature.geometry.coordinates[0];
        if (coords && coords.length > 2) {
          totalArea += calculatePolygonArea(coords);
        }
      }
    }

    return totalArea;
  } catch (error) {
    console.error("Error calculating area:", error);
    return 0;
  }
}

export default {
  // Constants
  CARBON_STOCK_MAP,
  LULC_LABELS,

  // Data processing
  loadCSVFromPublic,
  parseCSVCoordinates,
  reclassifyToCarbon,
  calculateCarbonStatistics,
  calculateDataBounds,

  // GeoJSON utilities
  extractPolygonCoordinates,
  isPointInPolygon,
  calculatePolygonArea,
  calculateGeoJSONBounds,
  validateGeoJSONForMeasurement,
  filterByPolygonOptimized,
  calculateGeoJSONOverlap,

  // Context data retrieval
  getGeoJSONSmartSearch,
  getLatestGeoJSONFromContext,
  listAvailableGeoJSONLayers,
  findCarbonStockAnalysis,
  findLCAMExtraction,
  findComparisonData,

  // Report generation
  matchPeriodsAndYears,
  generateLandUseChangeTable,
  generateCarbonPoolTable,
  generateComparisonTable,
  calculateOverallRiskLevel,
  countExtractedFields,
  generateContentPreview,
  extractPersonnelFromLCAM,

  // Utilities
  calculateDiscrepancy,
  calculateTrend,
  calculateArea,
  findRedFlagAnalysis,
};
