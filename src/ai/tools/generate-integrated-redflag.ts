import type { CreateToolsContext } from "@/ai";
import { generateObject, tool } from "ai";
import { ulid } from "ulid";
import z from "zod";
import { documentParseModel } from "../provider";
import { findRedFlagAnalysis } from "./carbon-analyze-helper";

// ============================
// TOOL 5: Integrated Critical Findings
// ============================

/**
 * Tool 5: Integrate all red flags into comprehensive critical findings
 */
export const generateIntegratedCriticalFindings = (ctx: CreateToolsContext) =>
  tool({
    name: "generate-integrated-critical-findings",
    description:
      "Integrate all red flag analyses into comprehensive critical findings report",
    inputSchema: z.object({
      environmentalRedFlag1Id: z
        .string()
        .optional()
        .nullable()
        .describe("ID of Environmental Red Flag 1 analysis"),
      environmentalRedFlag2Id: z
        .string()
        .optional()
        .nullable()
        .describe("ID of Environmental Red Flag 2 analysis"),
      financialRedFlag1Id: z
        .string()
        .optional()
        .nullable()
        .describe("ID of Financial Red Flag 1 analysis"),
      financialRedFlag2Id: z
        .string()
        .optional()
        .nullable()
        .describe("ID of Financial Red Flag 2 analysis"),
    }),
    execute: async ({
      environmentalRedFlag1Id,
      environmentalRedFlag2Id,
      financialRedFlag1Id,
      financialRedFlag2Id,
    }) => {
      const criticalFindingsId = ulid();

      ctx.writer.write({
        id: criticalFindingsId,
        type: "data-integrated-critical-findings",
        data: {
          name: "Integrating Critical Findings...",
          state: "in-progress",
        },
      });

      try {
        // Find all red flag analyses
        const envRedFlag1 = findRedFlagAnalysis(
          ctx.chat.id,
          "data-environmental-red-flag-1",
          environmentalRedFlag1Id,
        );
        const envRedFlag2 = findRedFlagAnalysis(
          ctx.chat.id,
          "data-environmental-red-flag-2",
          environmentalRedFlag2Id,
        );
        const finRedFlag1 = findRedFlagAnalysis(
          ctx.chat.id,
          "data-financial-red-flag-1",
          financialRedFlag1Id,
        );
        const finRedFlag2 = findRedFlagAnalysis(
          ctx.chat.id,
          "data-financial-red-flag-2",
          financialRedFlag2Id,
        );

        const analysisData = {
          environmentalRedFlag1: envRedFlag1,
          environmentalRedFlag2: envRedFlag2,
          financialRedFlag1: finRedFlag1,
          financialRedFlag2: finRedFlag2,
          availableAnalyses: [
            envRedFlag1,
            envRedFlag2,
            finRedFlag1,
            finRedFlag2,
          ].filter(Boolean).length,
        };

        const prompt = `Integrate semua analisis Red Flag menjadi Critical Findings komprehensif:

**ENVIRONMENTAL RED FLAG 1 - Carbon Activity:**
${envRedFlag1 ? envRedFlag1.redFlagNarrative || envRedFlag1.methodologyNarrative : "Not available"}

**ENVIRONMENTAL RED FLAG 2 - Land Disputes:**
${envRedFlag2 ? envRedFlag2.redFlagNarrative || envRedFlag2.methodologyNarrative : "Not available"}

**FINANCIAL RED FLAG 1 - PEPs:**
${finRedFlag1 ? finRedFlag1.redFlagNarrative || finRedFlag1.methodologyNarrative : "Not available"}

**FINANCIAL RED FLAG 2 - Trading Patterns:**
${finRedFlag2 ? finRedFlag2.methodologyNarrative || finRedFlag2.redFlagNarrative : "Not available"}

**AVAILABLE ANALYSES:** ${analysisData.availableAnalyses}/4

Buatlah Critical Findings terintegrasi yang:
1. Menggabungkan semua temuan red flag
2. Memberikan overall risk assessment
3. Prioritas investigasi berdasarkan severity
4. Rekomendasi tindakan komprehensif
5. Timeline investigasi yang terstruktur

Format: Executive summary + detailed findings, 800-1200 kata bahasa Indonesia.`;

        return await generateObject({
          model: documentParseModel,
          system:
            "You are a senior forensic analyst for PPATK creating integrated critical findings from multiple red flag analyses.",
          prompt: prompt,
          schema: z.object({
            executiveSummary: z
              .string()
              .describe("Executive summary of all critical findings"),
            integratedFindings: z
              .string()
              .describe("Comprehensive integrated critical findings narrative"),
            overallRiskLevel: z
              .enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
              .describe("Overall project risk level"),
            prioritizedActions: z
              .array(
                z.object({
                  priority: z.string(),
                  action: z.string(),
                  timeline: z.string(),
                  responsible: z.string(),
                }),
              )
              .describe("Prioritized investigation actions"),
            crossCuttingIssues: z
              .array(z.string())
              .describe("Issues that span multiple red flags"),
            investigationRoadmap: z
              .array(z.string())
              .describe("Step-by-step investigation roadmap"),
            resourceRequirements: z
              .array(z.string())
              .describe("Required resources and expertise"),
          }),
        })
          .then((result) => {
            ctx.writer.write({
              id: criticalFindingsId,
              type: "data-integrated-critical-findings",
              data: {
                name: "Integrated Critical Findings Report",
                state: "completed",
                executiveSummary: result.object.executiveSummary,
                integratedFindings: result.object.integratedFindings,
                overallRiskLevel: result.object.overallRiskLevel,
                prioritizedActions: result.object.prioritizedActions,
                crossCuttingIssues: result.object.crossCuttingIssues,
                investigationRoadmap: result.object.investigationRoadmap,
                resourceRequirements: result.object.resourceRequirements,
                analysisInputs: {
                  environmentalRedFlag1: !!envRedFlag1,
                  environmentalRedFlag2: !!envRedFlag2,
                  financialRedFlag1: !!finRedFlag1,
                  financialRedFlag2: !!finRedFlag2,
                  totalAnalyses: analysisData.availableAnalyses,
                },
                generatedAt: new Date().toISOString(),
              },
            });

            return {
              success: true,
              message: `Integrated Critical Findings report generated with ${analysisData.availableAnalyses}/4 red flag analyses`,
              criticalFindingsId,
              summary: {
                overallRiskLevel: result.object.overallRiskLevel,
                analysesIncluded: analysisData.availableAnalyses,
                priorityActions: result.object.prioritizedActions.length,
                crossCuttingIssues: result.object.crossCuttingIssues.length,
              },
            };
          })
          .catch((error) => {
            ctx.writer.write({
              id: criticalFindingsId,
              type: "data-integrated-critical-findings",
              data: {
                name: "Error generating Integrated Critical Findings",
                state: "failed",
                error: error.message,
              },
            });
            throw new Error(
              `Failed to generate Integrated Critical Findings: ${error.message}`,
            );
          });
      } catch (error) {
        ctx.writer.write({
          id: criticalFindingsId,
          type: "data-integrated-critical-findings",
          data: {
            name: "Error generating Integrated Critical Findings",
            state: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
        throw error;
      }
    },
  });
