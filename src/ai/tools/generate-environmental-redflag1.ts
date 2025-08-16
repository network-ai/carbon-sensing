import type { CreateToolsContext } from "@/ai";
import { generateObject, tool } from "ai";
import { ulid } from "ulid";
import z from "zod";
import { documentParseModel } from "../provider";
import {
  findComparisonData,
  findLCAMExtraction,
} from "./carbon-analyze-helper";

/**
 * Tool 1: Generate Environmental Red Flag analysis for lack of actual carbon reduction activities
 */
export const generateEnvironmentalRedFlag1 = (ctx: CreateToolsContext) =>
  tool({
    name: "generate-environmental-red-flag-1",
    description:
      "Analyze comparison data to detect lack of actual carbon reduction activities - Environmental Red Flag 1",
    inputSchema: z.object({
      comparisonAnalysisId: z
        .string()
        .optional()
        .nullable()
        .describe("ID of comparison analysis to use (default: latest)"),
      lcamDocumentId: z
        .string()
        .optional()
        .nullable()
        .describe("ID of LCAM document for context (default: latest)"),
    }),
    execute: async ({ comparisonAnalysisId, lcamDocumentId }) => {
      const redFlagId = ulid();

      ctx.writer.write({
        id: redFlagId,
        type: "data-environmental-red-flag-1",
        data: {
          name: "Analyzing Environmental Red Flag 1...",
          state: "in-progress",
        },
      });

      try {
        const comparisonData = findComparisonData(
          ctx.chat.id,
          comparisonAnalysisId,
        );
        const lcamData = findLCAMExtraction(ctx.chat.id, lcamDocumentId);

        if (!comparisonData) {
          throw new Error(
            "No comparison analysis found. Please run comparison analysis first.",
          );
        }

        if (!lcamData) {
          throw new Error(
            "No LCAM document found. Please upload and process LCAM document first.",
          );
        }

        // Extract key personnel from LCAM
        const keyPersonnel = {
          carbonManager:
            lcamData.extractedData?.informasi_umum?.pemilik_kegiatan
              ?.technical_partner || "Unknown",
          projectOwner:
            lcamData.extractedData?.informasi_umum?.pemilik_kegiatan
              ?.project_owner || "Unknown",
          communityPartner:
            lcamData.extractedData?.informasi_umum?.pemilik_kegiatan
              ?.community_partner || "Unknown",
        };

        const analysisData = {
          projectName:
            lcamData.extractedData?.informasi_umum?.judul_kegiatan ||
            "Unknown Project",
          discrepancyPercentage:
            comparisonData.summaryStatistics?.averageDiscrepancyPercentage || 0,
          totalLCAM: comparisonData.totalComparison?.totalLCAMReduction || 0,
          totalAI:
            comparisonData.totalComparison?.totalCarbonSensingSequestration ||
            0,
          comparisonTable: comparisonData.tableData || [],
          keyPersonnel,
        };

        const prompt = `Analisis Red Flag Lingkungan 1 untuk proyek ${analysisData.projectName}:

**DATA PERBANDINGAN LCAM vs CARBON SENSING AI:**
- Discrepancy: ${analysisData.discrepancyPercentage.toFixed(1)}%
- LCAM Claimed: ${analysisData.totalLCAM.toLocaleString()} ton CO2e
- AI Detection: ${analysisData.totalAI.toLocaleString()} ton CO2e

**PERSONEL KUNCI:**
- Carbon Manager: ${analysisData.keyPersonnel.carbonManager}
- Project Owner: ${analysisData.keyPersonnel.projectOwner}
- Community Partner: ${analysisData.keyPersonnel.communityPartner}

**TABLE DATA:**
${JSON.stringify(analysisData.comparisonTable.slice(0, 3), null, 2)}

Buatlah analisis Red Flag Lingkungan 1 yang fokus pada:
1. Tidak adanya aktivitas pengurangan karbon aktual
2. Kredit phantom yang dihasilkan
3. Rekomendasi investigasi arus keuangan
4. Contact person untuk investigasi lanjutan
5. Fokus pada pembayaran aktivitas konservasi yang diklaim

Format: Narasi investigatif bahasa Indonesia, 400-600 kata, include kontak dan angka spesifik.`;

        return await generateObject({
          model: documentParseModel,
          system:
            "You are a forensic environmental analyst for PPATK investigating carbon credit fraud. Generate detailed red flag analysis for environmental crimes.",
          prompt: prompt,
          schema: z.object({
            redFlagNarrative: z
              .string()
              .describe(
                "Comprehensive Environmental Red Flag 1 narrative in Indonesian",
              ),
            severity: z
              .enum(["CRITICAL", "HIGH", "MEDIUM"])
              .describe("Severity level of the red flag"),
            keyFindings: z
              .array(z.string())
              .describe("Key findings from the analysis"),
            investigationTargets: z
              .array(
                z.object({
                  name: z.string(),
                  role: z.string(),
                  suspiciousActivity: z.string(),
                }),
              )
              .describe("Key personnel to investigate"),
            recommendedActions: z
              .array(z.string())
              .describe("Recommended investigation actions"),
            financialFocusAreas: z
              .array(z.string())
              .describe("Financial areas to focus investigation on"),
          }),
        })
          .then((result) => {
            ctx.writer.write({
              id: redFlagId,
              type: "data-environmental-red-flag-1",
              data: {
                name: `Environmental Red Flag 1 - ${analysisData.projectName}`,
                state: "completed",
                redFlagNarrative: result.object.redFlagNarrative,
                severity: result.object.severity,
                keyFindings: result.object.keyFindings,
                investigationTargets: result.object.investigationTargets,
                recommendedActions: result.object.recommendedActions,
                financialFocusAreas: result.object.financialFocusAreas,
                analysisMetrics: {
                  discrepancyPercentage: analysisData.discrepancyPercentage,
                  phantomCredits: Math.abs(
                    analysisData.totalLCAM - analysisData.totalAI,
                  ),
                  economicImpact:
                    Math.abs(analysisData.totalLCAM - analysisData.totalAI) *
                    50000,
                },
                generatedAt: new Date().toISOString(),
              },
            });

            return {
              success: true,
              message: `Environmental Red Flag 1 analysis completed for ${analysisData.projectName}`,
              redFlagId,
              summary: result.object,
            };
          })
          .catch((error) => {
            ctx.writer.write({
              id: redFlagId,
              type: "data-environmental-red-flag-1",
              data: {
                name: "Error generating Environmental Red Flag 1",
                state: "failed",
                error: error.message,
              },
            });
            throw new Error(
              `Failed to generate Environmental Red Flag 1: ${error.message}`,
            );
          });
      } catch (error) {
        ctx.writer.write({
          id: redFlagId,
          type: "data-environmental-red-flag-1",
          data: {
            name: "Error generating Environmental Red Flag 1",
            state: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
        throw error;
      }
    },
  });
