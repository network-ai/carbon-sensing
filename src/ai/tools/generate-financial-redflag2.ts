import type { CreateToolsContext } from "@/ai";
import { generateObject, tool } from "ai";
import { ulid } from "ulid";
import z from "zod";
import { documentParseModel } from "../provider";
import { findLCAMExtraction } from "./carbon-analyze-helper";

/**
 * Tool 4: Placeholder for carbon credit trading pattern analysis
 */
export const generateFinancialRedFlag2 = (ctx: CreateToolsContext) =>
  tool({
    name: "generate-financial-red-flag-2",
    description:
      "Analyze carbon credit trading patterns and unusual transactions - Financial Red Flag 2 (Development Mode)",
    inputSchema: z.object({
      lcamDocumentId: z
        .string()
        .optional()
        .nullable()
        .describe("ID of LCAM document for context (default: latest)"),
      developmentMode: z
        .boolean()
        .default(true)
        .describe("Development mode flag"),
    }),
    execute: async ({ lcamDocumentId, developmentMode }) => {
      const redFlagId = ulid();

      ctx.writer.write({
        id: redFlagId,
        type: "data-financial-red-flag-2",
        data: {
          name: "Analyzing Financial Red Flag 2...",
          state: "in-progress",
        },
      });

      try {
        const lcamData = findLCAMExtraction(ctx.chat.id, lcamDocumentId);

        if (!lcamData) {
          throw new Error(
            "No LCAM document found. Please upload and process LCAM document first.",
          );
        }

        const analysisData = {
          projectName:
            lcamData.extractedData?.informasi_umum?.judul_kegiatan ||
            "Unknown Project",
          developmentMode: developmentMode,
        };

        const prompt = `Financial Red Flag 2 - Trading Pattern Analysis untuk proyek ${analysisData.projectName}:

**STATUS:** Development Mode - SRN MENLHK Integration Pending

**ANALYSIS FOCUS:**
1. Perdagangan kredit karbon kepada individu
2. Pola transaksi tidak biasa
3. Transaksi di bawah harga pasar
4. Pembeli tanpa kebutuhan offset legitimate
5. Potensi pencucian uang melalui carbon trading

**NOTE:** Fitur ini masih dalam pengembangan karena belum terhubung dengan data penjualan dari https://srn.menlhk.go.id/spe/

Buatlah template analisis Financial Red Flag 2 dan metodologi investigasi yang akan digunakan ketika data trading tersedia.`;

        return await generateObject({
          model: documentParseModel,
          system:
            "You are a forensic financial analyst creating methodology for analyzing carbon credit trading patterns when data becomes available.",
          prompt: prompt,
          schema: z.object({
            methodologyNarrative: z
              .string()
              .describe(
                "Methodology for Financial Red Flag 2 analysis in Indonesian",
              ),
            analysisFramework: z
              .array(z.string())
              .describe("Framework for trading pattern analysis"),
            redFlagsToMonitor: z
              .array(z.string())
              .describe("Trading red flags to monitor"),
            dataRequirements: z
              .array(z.string())
              .describe("Required data from SRN MENLHK"),
            investigationSteps: z
              .array(z.string())
              .describe("Investigation steps when data is available"),
            developmentStatus: z
              .string()
              .describe("Current development status"),
          }),
        })
          .then((result) => {
            ctx.writer.write({
              id: redFlagId,
              type: "data-financial-red-flag-2",
              data: {
                name: `Financial Red Flag 2 - ${analysisData.projectName} (Development)`,
                state: "completed",
                methodologyNarrative: result.object.methodologyNarrative,
                analysisFramework: result.object.analysisFramework,
                redFlagsToMonitor: result.object.redFlagsToMonitor,
                dataRequirements: result.object.dataRequirements,
                investigationSteps: result.object.investigationSteps,
                developmentStatus: result.object.developmentStatus,
                developmentMode: true,
                generatedAt: new Date().toISOString(),
              },
            });

            return {
              success: true,
              message: `Financial Red Flag 2 methodology created for ${analysisData.projectName} (Development Mode)`,
              redFlagId,
              summary: result.object,
            };
          })
          .catch((error) => {
            ctx.writer.write({
              id: redFlagId,
              type: "data-financial-red-flag-2",
              data: {
                name: "Error generating Financial Red Flag 2",
                state: "failed",
                error: error.message,
              },
            });
            throw new Error(
              `Failed to generate Financial Red Flag 2: ${error.message}`,
            );
          });
      } catch (error) {
        ctx.writer.write({
          id: redFlagId,
          type: "data-financial-red-flag-2",
          data: {
            name: "Error generating Financial Red Flag 2",
            state: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
        throw error;
      }
    },
  });
