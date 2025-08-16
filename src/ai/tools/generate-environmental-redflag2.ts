import type { CreateToolsContext } from "@/ai";
import { generateObject, tool } from "ai";
import { ulid } from "ulid";
import z from "zod";

import { documentParseModel } from "../provider";
import {
  calculateGeoJSONBounds,
  calculateGeoJSONOverlap,
  calculatePolygonArea,
  findLCAMExtraction,
  getGeoJSONSmartSearch,
  listAvailableGeoJSONLayers,
  validateGeoJSONForMeasurement,
} from "./carbon-analyze-helper";

/**
 * Tool 2: Analyze land disputes and unauthorized land use through GeoJSON overlay
 */
export const generateEnvironmentalRedFlag2 = (ctx: CreateToolsContext) =>
  tool({
    name: "generate-environmental-red-flag-2",
    description:
      "Analyze land disputes and unauthorized land use by overlaying project area with protected forest areas",
    inputSchema: z.object({
      geojsonLayerId: z
        .string()
        .describe(
          "ID of the GeoJSON layer to use as project boundary, or 'latest' for most recent upload",
        ),
      lcamDocumentId: z
        .string()
        .optional()
        .nullable()
        .describe("ID of LCAM document for context (default: latest)"),
    }),
    execute: async ({ geojsonLayerId, lcamDocumentId }) => {
      const redFlagId = ulid();

      ctx.writer.write({
        id: redFlagId,
        type: "data-environmental-red-flag-2",
        data: {
          name: "Analyzing Environmental Red Flag 2...",
          state: "in-progress",
        },
      });

      try {
        // Step 1: Get LCAM data
        const lcamData = findLCAMExtraction(ctx.chat.id, lcamDocumentId);

        if (!lcamData) {
          throw new Error(
            "No LCAM document found. Please upload and process LCAM document first.",
          );
        }

        // Step 2: Get project GeoJSON with validation
        const projectData = getGeoJSONSmartSearch(ctx.chat.id, geojsonLayerId);
        if (!projectData) {
          const availableLayers = listAvailableGeoJSONLayers(ctx.chat.id);
          let layersList = "No GeoJSON layers found.";
          if (availableLayers.length > 0) {
            layersList = availableLayers
              .map(
                (layer: { name: any; id: any }) =>
                  `- ${layer.name} (ID: ${layer.id})`,
              )
              .join("\n");
          }
          throw new Error(
            `GeoJSON layer not found. Available layers:\n${layersList}`,
          );
        }

        // Step 3: Validate project GeoJSON
        const projectValidation = validateGeoJSONForMeasurement(projectData);
        if (!projectValidation.valid) {
          throw new Error(
            `Invalid project GeoJSON: ${projectValidation.error}`,
          );
        }

        // Step 4: Load protected forest GeoJSON with error handling
        const baseUrl =
          typeof window !== "undefined"
            ? `${window.location.protocol}//${window.location.host}`
            : "http://localhost:3000";

        let protectedForestData;
        try {
          const response = await fetch(
            `${baseUrl}/hutan lindung dummy.geojson`,
          );

          if (!response.ok) {
            throw new Error(
              `Failed to fetch protected forest data: ${response.status} ${response.statusText}`,
            );
          }

          const protectedForestGeojson = await response.text();
          protectedForestData = JSON.parse(protectedForestGeojson);

          // Validate protected forest GeoJSON
          const protectedValidation =
            validateGeoJSONForMeasurement(protectedForestData);
          if (!protectedValidation.valid) {
            throw new Error(
              `Invalid protected forest GeoJSON: ${protectedValidation.error}`,
            );
          }
        } catch (fetchError) {
          console.error("Error loading protected forest data:", fetchError);
        }

        // Step 5: Calculate overlaps with improved error handling
        let overlaps;
        try {
          overlaps = calculateGeoJSONOverlap(projectData, protectedForestData);
          console.log("Overlap calculation result:", overlaps);
        } catch (overlapError) {
          console.error("Error calculating overlaps:", overlapError);
          // Provide fallback values
          overlaps = {
            hasOverlap: false,
            overlapArea: 0,
            overlapPercentage: 0,
          };
        }

        // Step 6: Calculate areas and bounds with error handling
        let projectAreaSize = 0;
        let protectedAreaSize = 0;
        let projectBounds: [number, number, number, number] = [0, 0, 0, 0];
        let protectedBounds: [number, number, number, number] = [0, 0, 0, 0];

        try {
          projectAreaSize = calculatePolygonArea(projectData);
          projectBounds = calculateGeoJSONBounds(projectData);
        } catch (error) {
          console.error("Error calculating project area/bounds:", error);
          projectAreaSize = 0;
          projectBounds = [0, 0, 0, 0];
        }

        try {
          protectedAreaSize = calculatePolygonArea(protectedForestData);
          protectedBounds = calculateGeoJSONBounds(protectedForestData);
        } catch (error) {
          console.error("Error calculating protected area/bounds:", error);
          protectedAreaSize = 0;
          protectedBounds = [0, 0, 0, 0];
        }

        // Step 7: Prepare analysis data
        const analysisData = {
          projectName:
            lcamData.extractedData?.informasi_umum?.judul_kegiatan ||
            "Unknown Project",
          projectLocation:
            lcamData.extractedData?.informasi_umum?.alamat_dan_lokasi
              ?.lokasi_tapak || "Unknown",
          communityPartner:
            lcamData.extractedData?.informasi_umum?.pemilik_kegiatan
              ?.community_partner || "Unknown",
          overlaps: overlaps,
          projectAreaSize: projectAreaSize,
          protectedAreaSize: protectedAreaSize,
          projectBounds: projectBounds,
          protectedBounds: protectedBounds,
          geojsonLayerId: geojsonLayerId,
          projectFeatureCount: projectData.features?.length || 0,
          protectedFeatureCount: protectedForestData.features?.length || 0,
        };

        // Step 8: Generate analysis prompt
        const prompt = `Analisis Red Flag Lingkungan 2 untuk proyek ${analysisData.projectName}:

**LOKASI PROJECT:**
- Nama: ${analysisData.projectName}
- Lokasi: ${analysisData.projectLocation}
- Mitra Komunitas: ${analysisData.communityPartner}
- GeoJSON Layer ID: ${analysisData.geojsonLayerId}

**ANALISIS SPASIAL:**
- Project Area: ${analysisData.projectAreaSize.toFixed(2)} hektar
- Protected Forest Area: ${analysisData.protectedAreaSize.toFixed(2)} hektar
- Overlap Detected: ${analysisData.overlaps.hasOverlap ? "YES" : "NO"}
- Overlap Area: ${(analysisData.overlaps.overlapArea || 0).toFixed(2)} hektar
- Overlap Percentage: ${(analysisData.overlaps.overlapPercentage || 0).toFixed(1)}%
- Project Bounds: [${analysisData.projectBounds.map((n) => n.toFixed(4)).join(", ")}]
- Protected Bounds: [${analysisData.protectedBounds.map((n) => n.toFixed(4)).join(", ")}]

**GEOJSON DATA:**
- Project Features: ${analysisData.projectFeatureCount}
- Protected Forest Features: ${analysisData.protectedFeatureCount}

**TINGKAT RISIKO:**
${
  analysisData.overlaps.hasOverlap
    ? analysisData.overlaps.overlapPercentage > 50
      ? "CRITICAL - Tumpang tindih signifikan dengan kawasan lindung"
      : analysisData.overlaps.overlapPercentage > 20
        ? "HIGH - Tumpang tindih substansial terdeteksi"
        : "MEDIUM - Tumpang tindih minor terdeteksi"
    : "LOW - Tidak ada tumpang tindih terdeteksi"
}

Buatlah analisis Red Flag Lingkungan 2 yang fokus pada:
1. Sengketa lahan dan penggunaan lahan tidak berizin
2. Klaim lahan yang tumpang tindih dengan kawasan lindung
3. Verifikasi sertifikat lahan dengan ATR/BPN
4. Investigasi proses akuisisi lahan dari masyarakat
5. Analisis pembayaran kompensasi dan transparansi

Format: Narasi investigatif bahasa Indonesia, 400-600 kata.`;

        // Step 9: Generate AI analysis
        return await generateObject({
          model: documentParseModel,
          system:
            "You are a forensic spatial analyst for PPATK investigating land disputes and unauthorized land use in carbon projects.",
          prompt: prompt,
          schema: z.object({
            redFlagNarrative: z
              .string()
              .describe(
                "Comprehensive Environmental Red Flag 2 narrative in Indonesian",
              ),
            severity: z
              .enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
              .describe(
                "Severity level based on land overlap and risk factors",
              ),
            spatialFindings: z
              .array(z.string())
              .describe("Key spatial analysis findings"),
            landIssues: z
              .array(
                z.object({
                  issue: z.string(),
                  location: z.string(),
                  severity: z.string(),
                }),
              )
              .describe("Identified land use issues"),
            verificationNeeded: z
              .array(z.string())
              .describe("Areas requiring land certificate verification"),
            investigationTargets: z
              .array(z.string())
              .describe("Community partners and officials to investigate"),
            recommendedActions: z
              .array(z.string())
              .describe("Recommended follow-up actions"),
          }),
        })
          .then((result) => {
            ctx.writer.write({
              id: redFlagId,
              type: "data-environmental-red-flag-2",
              data: {
                name: `Environmental Red Flag 2 - ${analysisData.projectName}`,
                state: "completed",
                redFlagNarrative: result.object.redFlagNarrative,
                severity: result.object.severity,
                spatialFindings: result.object.spatialFindings,
                landIssues: result.object.landIssues,
                verificationNeeded: result.object.verificationNeeded,
                investigationTargets: result.object.investigationTargets,
                recommendedActions: result.object.recommendedActions,
                spatialAnalysis: {
                  projectArea: analysisData.projectBounds, // Bounding box [minLng, minLat, maxLng, maxLat]
                  protectedArea: analysisData.protectedBounds, // Bounding box [minLng, minLat, maxLng, maxLat]
                  projectAreaSize: analysisData.projectAreaSize, // Area in hectares
                  protectedAreaSize: analysisData.protectedAreaSize, // Area in hectares
                  hasOverlap: analysisData.overlaps.hasOverlap,
                  overlapArea: analysisData.overlaps.overlapArea,
                  overlapPercentage: analysisData.overlaps.overlapPercentage,
                  projectFeatureCount: analysisData.projectFeatureCount,
                  protectedFeatureCount: analysisData.protectedFeatureCount,
                },
                geojsonLayerId: analysisData.geojsonLayerId,
                generatedAt: new Date().toISOString(),
              },
            });

            return {
              success: true,
              message: `Environmental Red Flag 2 analysis completed for ${analysisData.projectName}`,
              redFlagId,
              summary: {
                severity: result.object.severity,
                hasOverlap: analysisData.overlaps.hasOverlap,
                overlapPercentage: analysisData.overlaps.overlapPercentage,
                keyFindings: result.object.spatialFindings.slice(0, 3),
              },
            };
          })
          .catch((error) => {
            ctx.writer.write({
              id: redFlagId,
              type: "data-environmental-red-flag-2",
              data: {
                name: "Error generating Environmental Red Flag 2",
                state: "failed",
                error: error.message,
              },
            });
            throw new Error(
              `Failed to generate Environmental Red Flag 2: ${error.message}`,
            );
          });
      } catch (error) {
        console.error("Environmental Red Flag 2 analysis error:", error);

        ctx.writer.write({
          id: redFlagId,
          type: "data-environmental-red-flag-2",
          data: {
            name: "Error generating Environmental Red Flag 2",
            state: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
        throw error;
      }
    },
  });
