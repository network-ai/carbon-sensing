import { chatDB } from "@/config/db";
import type {
  AvailableGeoJSONLayer,
  GeoJSONAttachment,
  MessageWithAttachments,
} from "../parts";

// Import file storage functions
import { getFile } from "@/lib/file-store";

/**
 * Helper function untuk mengakses GeoJSON dari context/messages sebelumnya
 * UPDATED: Support file storage system
 */
export function getGeoJSONFromContext(
  chatId: string,
  layerIdentifier: string,
): any | null {
  const messages = chatDB.get(chatId) as MessageWithAttachments[];

  if (!messages) {
    return null;
  }

  for (const message of messages) {
    // UPDATED: Cek attachments dengan file storage support
    if (message.attachments) {
      for (const attachment of message.attachments) {
        if (attachment.type === "geojson") {
          const geojsonAttachment = attachment as GeoJSONAttachment;

          // Match berdasarkan ID attachment
          if (geojsonAttachment.id === layerIdentifier) {
            return getGeoJSONContent(geojsonAttachment);
          }

          // Match berdasarkan nama file
          if (
            geojsonAttachment.name === layerIdentifier ||
            geojsonAttachment.name.replace(".geojson", "") ===
              layerIdentifier ||
            layerIdentifier === "latest" ||
            layerIdentifier.includes(
              geojsonAttachment.name.replace(".geojson", ""),
            )
          ) {
            return getGeoJSONContent(geojsonAttachment);
          }
        }
      }
    }

    // Cek parts (untuk data yang sudah diproses oleh tools)
    if (message.parts) {
      for (const part of message.parts) {
        // PERBAIKAN: Cek tipe yang tepat dan struktur data
        if (
          part.type === "text" && // parts dari MessageWithAttachments hanya berisi text
          "data" in part && // Cek apakah ada data property (untuk tool results)
          (part as any).data &&
          (part as any).data.type === "data-maps-geojson" &&
          (part as any).data.data &&
          (part as any).data.data.state === "completed" &&
          (part as any).data.data.geojson
        ) {
          const toolResult = part as any;
          const storedId = toolResult.data.id;
          const storedName = toolResult.data.data?.name;

          // Coba cocokkan dengan ULID murni (dari tool upload-geojson)
          if (storedId === layerIdentifier) {
            return toolResult.data.data.geojson;
          }

          // Coba ekstrak ULID dari identifier yang mungkin berformat "Area of Interest ULID"
          if (layerIdentifier.startsWith("Area of Interest ")) {
            const ulidFromIdentifier = layerIdentifier.replace(
              "Area of Interest ",
              "",
            );
            if (storedId === ulidFromIdentifier) {
              return toolResult.data.data.geojson;
            }
          }

          // Coba ekstrak ULID dari identifier yang mungkin berformat "geojson-layer-ULID-outline"
          if (
            layerIdentifier.startsWith("geojson-layer-") &&
            layerIdentifier.endsWith("-outline")
          ) {
            const parts = layerIdentifier.split("-");
            const ulidFromIdentifier = parts[2];
            if (storedId === ulidFromIdentifier) {
              return toolResult.data.data.geojson;
            }
          }

          // Coba cocokkan dengan nama lengkap yang disimpan
          if (storedName === layerIdentifier) {
            return toolResult.data.data.geojson;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Helper function untuk mendapatkan GeoJSON terbaru (latest) dari chatId
 * UPDATED: Support file storage system
 */
export function getLatestGeoJSONFromContext(chatId: string): any | null {
  const messages = chatDB.get(chatId) as MessageWithAttachments[];

  if (!messages) {
    return null;
  }

  let latestGeoJSON = null;
  let latestTimestamp = 0;

  // Iterasi dari belakang ke depan untuk mendapatkan yang terbaru
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];

    // UPDATED: Cek attachments dengan file storage support
    if (message.attachments) {
      for (const attachment of message.attachments) {
        if (attachment.type === "geojson") {
          // Gunakan timestamp dari message atau ULID attachment
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

    // Cek parts (untuk data yang sudah diproses)
    if (message.parts) {
      for (const part of message.parts) {
        // PERBAIKAN: Cek struktur yang tepat untuk tool results
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

          // Gunakan timestamp dari message atau ULID jika tersedia
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
 * Helper function untuk mencari GeoJSON dengan pattern matching
 * UPDATED: Support file storage system
 */
export function findGeoJSONByPattern(
  chatId: string,
  pattern: string,
): any | null {
  const messages = chatDB.get(chatId) as MessageWithAttachments[];

  if (!messages) {
    return null;
  }

  for (const message of messages) {
    // UPDATED: Cek attachments dengan file storage support
    if (message.attachments) {
      for (const attachment of message.attachments) {
        if (attachment.type === "geojson") {
          const attachmentId = attachment.id;
          const attachmentName = attachment.name || "";

          // Pattern matching yang lebih fleksibel
          if (
            attachmentId.includes(pattern) ||
            attachmentName.toLowerCase().includes(pattern.toLowerCase()) ||
            pattern.includes(attachmentId) ||
            pattern.toLowerCase().includes(attachmentName.toLowerCase())
          ) {
            const geojsonContent = getGeoJSONContent(
              attachment as GeoJSONAttachment,
            );
            if (geojsonContent) {
              return geojsonContent;
            }
          }
        }
      }
    }

    // Cek parts
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
          const storedId = toolResult.data.id;
          const storedName = toolResult.data.data?.name || "";

          // Pattern matching yang lebih fleksibel
          if (
            storedId?.includes(pattern) ||
            storedName.toLowerCase().includes(pattern.toLowerCase()) ||
            pattern.includes(storedId || "")
          ) {
            return toolResult.data.data.geojson;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Helper function untuk mendaftar semua GeoJSON layers yang tersedia di chatId
 * UPDATED: Support file storage system
 */
export function listAvailableGeoJSONLayers(
  chatId: string,
): AvailableGeoJSONLayer[] {
  const availableLayers: AvailableGeoJSONLayer[] = [];
  const messages = chatDB.get(chatId) as MessageWithAttachments[];

  if (!messages) {
    return [];
  }

  for (const message of messages) {
    // UPDATED: Cek attachments dengan file storage support
    if (message.attachments) {
      for (const attachment of message.attachments) {
        if (attachment.type === "geojson") {
          const geojsonAttachment = attachment as GeoJSONAttachment;

          // Cek apakah sudah ada di list
          if (
            !availableLayers.find((layer) => layer.id === geojsonAttachment.id)
          ) {
            let featureCount = 0;
            let source: "attachment" | "processed" | "stored" = "attachment";

            // Determine feature count and source
            if (geojsonAttachment.metadata?.featureCount) {
              featureCount = geojsonAttachment.metadata.featureCount;
            } else {
              const geojsonContent = getGeoJSONContent(geojsonAttachment);
              if (geojsonContent) {
                featureCount = getFeatureCount(geojsonContent);
              }
            }

            // Determine if file is stored
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
              // NEW: Storage metadata
              storageMetadata: geojsonAttachment.fileStored
                ? {
                    storageKey: geojsonAttachment.name,
                    size: geojsonAttachment.size,
                    lastAccessed: new Date().toISOString(),
                  }
                : undefined,
            });
          }
        }
      }
    }

    // Cek parts (processed data)
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
          // Cek apakah sudah ada di list
          if (
            !availableLayers.find((layer) => layer.id === toolResult.data.id)
          ) {
            availableLayers.push({
              id: toolResult.data.id,
              name:
                toolResult.data.data.name ||
                `GeoJSON Layer ${toolResult.data.id}`,
              featureCount: toolResult.data.data.featureCount || 0,
              timestamp:
                message.timestamp ||
                extractTimestampFromULID(toolResult.data.id),
              source: "processed",
            });
          }
        }
      }
    }
  }

  // Sort by timestamp descending (terbaru dulu)
  availableLayers.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return availableLayers;
}

/**
 * NEW: Helper function untuk mendapatkan GeoJSON content dari attachment
 * Handles both stored files dan direct content
 */
function getGeoJSONContent(attachment: GeoJSONAttachment): any | null {
  try {
    // Jika content ada dan bukan "[HIDDEN]" atau "[STORED]", parse langsung
    if (
      attachment.content &&
      attachment.content !== "[HIDDEN]" &&
      attachment.content !== "[STORED]"
    ) {
      return JSON.parse(attachment.content);
    }

    // Jika file disimpan di storage, ambil dari storage
    if (attachment.fileStored && attachment.name) {
      const storedContent = getFile(attachment.name);
      if (storedContent) {
        return JSON.parse(storedContent);
      }
    }

    // Jika ada parsedGeoJSON dari metadata, gunakan itu
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
 * Helper function untuk count features (dipindah ke sini agar bisa digunakan)
 */
function getFeatureCount(geojson: any): number {
  if (!geojson) return 0;

  if (geojson.type === "FeatureCollection") {
    return geojson.features?.length || 0;
  } else if (geojson.type === "Feature") {
    return 1;
  } else {
    return 1; // Single geometry
  }
}

/**
 * FIXED: Helper function untuk validasi bahwa GeoJSON cocok untuk measurement
 */
export function validateGeoJSONForMeasurement(geojson: any): {
  valid: boolean;
  error?: string;
} {
  if (!geojson) {
    return { valid: false, error: "GeoJSON data is null or undefined" };
  }

  console.log("Validating GeoJSON type:", geojson.type);

  // Handle different GeoJSON structures
  if (geojson.type === "FeatureCollection") {
    if (!geojson.features || geojson.features.length === 0) {
      return { valid: false, error: "FeatureCollection is empty" };
    }

    // Check if at least one feature has valid geometry
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

    // Validate coordinates for at least one valid feature
    for (const feature of geojson.features) {
      if (
        feature.geometry &&
        (feature.geometry.type === "Polygon" ||
          feature.geometry.type === "MultiPolygon")
      ) {
        const coordValidation = validateGeometryCoordinates(feature.geometry);
        if (!coordValidation.valid) {
          return coordValidation;
        }
        break; // At least one valid feature found
      }
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

    return validateGeometryCoordinates(geojson.geometry);
  } else if (geojson.type === "Polygon" || geojson.type === "MultiPolygon") {
    // Direct geometry object
    return validateGeometryCoordinates(geojson);
  } else {
    return {
      valid: false,
      error: `Unsupported GeoJSON type: ${geojson.type}. Must be Polygon, MultiPolygon, Feature, or FeatureCollection`,
    };
  }
}

/**
 * FIXED: Helper function untuk validasi koordinat geometry
 */
function validateGeometryCoordinates(geometry: any): {
  valid: boolean;
  error?: string;
} {
  if (!geometry || !geometry.coordinates) {
    return { valid: false, error: "Geometry has no coordinates" };
  }

  if (geometry.type === "Polygon") {
    // Polygon: coordinates is array of LinearRing (array of positions)
    // Format: [[[lng, lat], [lng, lat], ...], [...holes...]]
    if (
      !Array.isArray(geometry.coordinates) ||
      geometry.coordinates.length === 0
    ) {
      return {
        valid: false,
        error: "Polygon coordinates must be a non-empty array",
      };
    }

    const exteriorRing = geometry.coordinates[0];
    if (!Array.isArray(exteriorRing) || exteriorRing.length < 4) {
      return {
        valid: false,
        error: "Polygon exterior ring must have at least 4 coordinate pairs",
      };
    }

    // Check if coordinates are valid [lng, lat] pairs
    for (const coord of exteriorRing) {
      if (
        !Array.isArray(coord) ||
        coord.length < 2 ||
        typeof coord[0] !== "number" ||
        typeof coord[1] !== "number"
      ) {
        return { valid: false, error: "Invalid coordinate pair in polygon" };
      }
    }

    return { valid: true };
  } else if (geometry.type === "MultiPolygon") {
    // MultiPolygon: coordinates is array of Polygon coordinates
    // Format: [[[[lng, lat], [lng, lat], ...]], [[[lng, lat], [lng, lat], ...]]]
    if (
      !Array.isArray(geometry.coordinates) ||
      geometry.coordinates.length === 0
    ) {
      return {
        valid: false,
        error: "MultiPolygon coordinates must be a non-empty array",
      };
    }

    for (const polygon of geometry.coordinates) {
      if (!Array.isArray(polygon) || polygon.length === 0) {
        return { valid: false, error: "MultiPolygon contains invalid polygon" };
      }

      const exteriorRing = polygon[0];
      if (!Array.isArray(exteriorRing) || exteriorRing.length < 4) {
        return {
          valid: false,
          error: "MultiPolygon contains polygon with invalid exterior ring",
        };
      }

      // Check if coordinates are valid [lng, lat] pairs
      for (const coord of exteriorRing) {
        if (
          !Array.isArray(coord) ||
          coord.length < 2 ||
          typeof coord[0] !== "number" ||
          typeof coord[1] !== "number"
        ) {
          return {
            valid: false,
            error: "Invalid coordinate pair in MultiPolygon",
          };
        }
      }
    }

    return { valid: true };
  } else {
    return {
      valid: false,
      error: `Unsupported geometry type for measurement: ${geometry.type}`,
    };
  }
}

/**
 * Helper function untuk extract timestamp dari ULID
 */
function extractTimestampFromULID(ulid: string): number {
  if (!ulid || ulid.length < 10) return 0;

  try {
    // ULID format: first 10 characters adalah timestamp dalam base32
    const timestampPart = ulid.substring(0, 10);
    const timestamp = parseInt(timestampPart, 36); // Rough conversion
    return timestamp;
  } catch (error) {
    return 0;
  }
}

/**
 * Helper function untuk auto-detect GeoJSON yang paling cocok
 * UPDATED: Support file storage system
 */
export function getGeoJSONSmartSearch(
  chatId: string,
  identifier?: string,
): any | null {
  // Jika identifier tidak diberikan atau 'latest', ambil yang terbaru
  if (!identifier || identifier === "latest") {
    return getLatestGeoJSONFromContext(chatId);
  }

  // Coba pencarian exact match dulu
  let result = getGeoJSONFromContext(chatId, identifier);
  if (result) return result;

  // Jika tidak ketemu, coba pattern matching
  result = findGeoJSONByPattern(chatId, identifier);
  if (result) return result;

  // Jika masih tidak ketemu, ambil yang terbaru sebagai fallback
  return getLatestGeoJSONFromContext(chatId);
}

/**
 * Type guard untuk mengecek apakah part adalah tool result
 */
function isToolResult(
  part: any,
): part is { data: { type: string; id: string; data: any } } {
  return (
    part &&
    typeof part === "object" &&
    "data" in part &&
    part.data &&
    typeof part.data === "object" &&
    "type" in part.data &&
    "id" in part.data &&
    "data" in part.data
  );
}

/**
 * Type guard untuk mengecek apakah tool result adalah GeoJSON
 */
function isGeoJSONToolResult(toolResult: any): boolean {
  return (
    toolResult.data.type === "data-maps-geojson" &&
    toolResult.data.data &&
    toolResult.data.data.state === "completed" &&
    toolResult.data.data.geojson
  );
}
