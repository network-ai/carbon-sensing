import type { CreateToolsContext } from "@/ai";
import { generateObject, tool } from "ai";
import { ulid } from "ulid";
import z from "zod";

// Import helper functions to find data
import { documentParseModel } from "../provider";
import {
  findCarbonStockAnalysis,
  findComparisonData,
  findLCAMExtraction,
  findRedFlagAnalysis,
} from "./carbon-analyze-helper";

/**
 * Tool to generate AI-powered anomaly detection narrative with integrated red flags for PPATK investigation
 *
 * @param {CreateToolsContext} ctx
 * @returns
 */
export const findAnomaly = (ctx: CreateToolsContext) =>
  tool({
    name: "generate-anomaly-with-claude",
    description:
      "Generate comprehensive anomaly detection narrative with integrated red flags using Claude AI for PPATK investigation purposes",
    inputSchema: z.object({
      carbonStockAnalysisId: z
        .string()
        .optional()
        .nullable()
        .describe("ID of carbon stock analysis to use (default: latest)"),
      lcamDocumentId: z
        .string()
        .optional()
        .nullable()
        .describe("ID of LCAM document extraction to use (default: latest)"),
      comparisonAnalysisId: z
        .string()
        .optional()
        .nullable()
        .describe(
          "ID of comparison analysis to use (default: latest if available)",
        ),
      focusArea: z
        .enum(["financial_crime", "technical_anomaly", "comprehensive"])
        .default("comprehensive")
        .describe("Focus area for anomaly detection"),
      includeRedFlags: z
        .boolean()
        .default(true)
        .describe("Whether to include integrated red flag analysis"),
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
      carbonStockAnalysisId,
      lcamDocumentId,
      comparisonAnalysisId,
      focusArea,
      includeRedFlags,
      environmentalRedFlag1Id,
      environmentalRedFlag2Id,
      financialRedFlag1Id,
      financialRedFlag2Id,
    }) => {
      const anomalyId = ulid();

      ctx.writer.write({
        id: anomalyId,
        type: "data-anomaly-detection",
        data: {
          name: "Generating AI-powered anomaly detection with integrated red flags...",
          state: "in-progress",
        },
      });

      try {
        // Find required data sources
        const carbonData = findCarbonStockAnalysis(
          ctx.chat.id,
          carbonStockAnalysisId,
        );
        if (!carbonData) {
          throw new Error(
            "No carbon stock analysis found. Please run analyze-carbon-stock first.",
          );
        }

        const lcamData = findLCAMExtraction(ctx.chat.id, lcamDocumentId);
        if (!lcamData) {
          throw new Error(
            "No LCAM document found. Please upload and process LCAM document first.",
          );
        }

        const comparisonData = findComparisonData(
          ctx.chat.id,
          comparisonAnalysisId,
        );

        let integratedRedFlags: any = null;
        let individualRedFlags: {
          environmentalRedFlag1: any;
          environmentalRedFlag2: any;
          financialRedFlag1: any;
          financialRedFlag2: any;
        } = {
          environmentalRedFlag1: null,
          environmentalRedFlag2: null,
          financialRedFlag1: null,
          financialRedFlag2: null,
        };

        if (includeRedFlags) {
          // Try to find integrated critical findings first
          integratedRedFlags = findRedFlagAnalysis(
            ctx.chat.id,
            "data-integrated-critical-findings",
          );

          // If not found, try to find individual red flags
          if (!integratedRedFlags) {
            individualRedFlags = {
              environmentalRedFlag1: findRedFlagAnalysis(
                ctx.chat.id,
                "data-environmental-red-flag-1",
                environmentalRedFlag1Id,
              ),
              environmentalRedFlag2: findRedFlagAnalysis(
                ctx.chat.id,
                "data-environmental-red-flag-2",
                environmentalRedFlag2Id,
              ),
              financialRedFlag1: findRedFlagAnalysis(
                ctx.chat.id,
                "data-financial-red-flag-1",
                financialRedFlag1Id,
              ),
              financialRedFlag2: findRedFlagAnalysis(
                ctx.chat.id,
                "data-financial-red-flag-2",
                financialRedFlag2Id,
              ),
            };
          }
        }

        // Prepare structured data for Claude
        const analysisData = {
          project:
            lcamData.extractedData?.informasi_umum?.judul_kegiatan ||
            "Unknown Project",
          owner:
            lcamData.extractedData?.informasi_umum?.pemilik_kegiatan
              ?.project_owner || "Unknown",
          location:
            lcamData.extractedData?.informasi_umum?.alamat_dan_lokasi
              ?.lokasi_tapak || "Unknown",
          area: carbonData.measurementArea || 0,
          years: carbonData.analyzedYears || [],
          totalLCAM: comparisonData?.totalComparison?.totalLCAMReduction || 0,
          totalAI:
            comparisonData?.totalComparison?.totalCarbonSensingSequestration ||
            0,
          avgDiscrepancy:
            comparisonData?.summaryStatistics?.averageDiscrepancyPercentage ||
            0,
          comparisonTable: comparisonData?.tableData?.slice(0, 5) || [],
          carbonPoolTable: carbonData.carbonPoolTableData?.slice(0, 5) || [],
          lulcTable: carbonData.lulcTableData?.slice(0, 10) || [],
        };

        const discrepancyValue = Math.abs(
          analysisData.totalLCAM - analysisData.totalAI,
        );
        const economicValue = discrepancyValue * 50000; // IDR estimation

        // Create Claude API prompt based on focus area
        let prompt = `Analisis data carbon stock untuk deteksi anomali PPATK dengan Red Flag terintegrasi:

**PROJECT INFORMATION:**
- Nama Project: ${analysisData.project}
- Pemilik: ${analysisData.owner}
- Lokasi: ${analysisData.location}
- Area: ${analysisData.area} hektar
- Periode: ${analysisData.years.join(", ")}

**DISCREPANCY ANALYSIS:**
- Total LCAM Claimed: ${analysisData.totalLCAM.toLocaleString()} ton CO2e
- Total AI Detection: ${analysisData.totalAI.toLocaleString()} ton CO2e
- Average Discrepancy: ${analysisData.avgDiscrepancy.toFixed(1)}%
- Discrepancy Value: ${discrepancyValue.toLocaleString()} ton CO2e
- Economic Impact: Rp ${economicValue.toLocaleString()}

**TABLE DATA SAMPLES:**
COMPARISON DATA: ${JSON.stringify(analysisData.comparisonTable, null, 2)}
CARBON POOL DATA: ${JSON.stringify(analysisData.carbonPoolTable, null, 2)}
LULC DATA: ${JSON.stringify(analysisData.lulcTable, null, 2)}`;

        // Add Red Flag Analysis to prompt - FIXED VERSION
        if (includeRedFlags) {
          prompt += `\n\n**RED FLAG ANALYSIS:**`;

          if (integratedRedFlags) {
            // Handle integrated red flags - cek apakah ada nested data atau langsung
            const findings =
              integratedRedFlags.integratedFindings ||
              integratedRedFlags.executiveSummary ||
              integratedRedFlags.data?.integratedFindings ||
              integratedRedFlags.data?.executiveSummary ||
              "Integrated findings available";

            const riskLevel =
              integratedRedFlags.overallRiskLevel ||
              integratedRedFlags.data?.overallRiskLevel ||
              "Unknown";

            prompt += `\n**INTEGRATED CRITICAL FINDINGS:**
        ${findings}
        Risk Level: ${riskLevel}`;
          } else {
            // Include individual red flags dengan safe checking
            if (individualRedFlags.environmentalRedFlag1) {
              const rf1 = individualRedFlags.environmentalRedFlag1;
              // Handle both direct properties dan nested data
              const narrative =
                rf1.redFlagNarrative ||
                rf1.data?.redFlagNarrative ||
                "Analysis available";
              const severity = rf1.severity || rf1.data?.severity || "Unknown";

              prompt += `\n**Environmental Red Flag 1 - Carbon Activity:**
        ${narrative}
        Severity: ${severity}`;
            }

            if (individualRedFlags.environmentalRedFlag2) {
              const rf2 = individualRedFlags.environmentalRedFlag2;
              const narrative =
                rf2.redFlagNarrative ||
                rf2.data?.redFlagNarrative ||
                "Analysis available";
              const severity = rf2.severity || rf2.data?.severity || "Unknown";

              prompt += `\n**Environmental Red Flag 2 - Land Disputes:**
        ${narrative}
        Severity: ${severity}`;
            }

            if (individualRedFlags.financialRedFlag1) {
              const rf3 = individualRedFlags.financialRedFlag1;
              const narrative =
                rf3.redFlagNarrative ||
                rf3.data?.redFlagNarrative ||
                "Analysis available";
              const severity =
                rf3.pepsSeverity || rf3.data?.pepsSeverity || "Unknown";

              prompt += `\n**Financial Red Flag 1 - PEPs:**
        ${narrative}
        Severity: ${severity}`;
            }

            if (individualRedFlags.financialRedFlag2) {
              const rf4 = individualRedFlags.financialRedFlag2;
              const narrative =
                rf4.methodologyNarrative ||
                rf4.data?.methodologyNarrative ||
                "Methodology available";
              const status =
                rf4.developmentStatus ||
                rf4.data?.developmentStatus ||
                "Development";

              prompt += `\n**Financial Red Flag 2 - Trading Patterns:**
        ${narrative}
        Status: ${status}`;
            }
          }
        }

        // Add specific instructions based on focus area
        if (focusArea === "financial_crime") {
          prompt += `

**FOKUS ANALISIS: FINANCIAL CRIME DETECTION**
Buatlah narasi yang berfokus pada:
1. Indikator skema kejahatan finansial dalam carbon trading
2. Pola over-claiming untuk menghasilkan carbon credits palsu
3. Potensi money laundering melalui carbon credit transactions
4. Estimasi kerugian finansial negara
5. Rekomendasi investigasi lanjutan untuk PPATK
6. Integrasi temuan red flag finansial dan lingkungan`;
        } else if (focusArea === "technical_anomaly") {
          prompt += `

**FOKUS ANALISIS: TECHNICAL ANOMALY DETECTION**
Buatlah narasi yang berfokus pada:
1. Ketidakkonsistenan teknis dalam metodologi carbon accounting
2. Anomali spasial dan temporal dalam data satelit
3. Perbedaan signifikan dalam perhitungan carbon stock
4. Indikator manipulasi data teknis
5. Validasi terhadap standar internasional
6. Integrasi temuan red flag teknis dan lingkungan`;
        } else {
          prompt += `

**FOKUS ANALISIS: COMPREHENSIVE INVESTIGATION**
Buatlah narasi yang mencakup:
1. Anomali finansial dan teknis secara komprehensif
2. Pola sistematis yang mengindikasikan fraud
3. Cross-verification antara multiple data sources
4. Risk assessment untuk investigasi lanjutan
5. Prioritas tindakan investigatif
6. Integrasi semua temuan red flag (lingkungan dan finansial)`;
        }

        prompt += `

**FORMAT OUTPUT:**
- Gunakan bahasa Indonesia formal investigatif
- 6-8 paragraf komprehensif (1200-1500 kata) dengan integrasi red flags
- Sertakan angka spesifik dan persentase
- Identifikasi red flags dan pola mencurigakan
- Berikan risk assessment (CRITICAL/HIGH/MEDIUM/LOW)
- Fokus pada actionable findings untuk PPATK
- Integrasikan semua temuan red flag dalam narasi

Buatlah analisis anomali yang detail, forensik, dan terintegrasi dengan red flag:`;

        // Generate anomaly detection using AI
        return await generateObject({
          model: documentParseModel,
          system:
            "You are an expert forensic analyst specializing in carbon credit fraud detection for PPATK (Indonesia's Financial Intelligence Unit). Analyze carbon stock data discrepancies and integrate red flag findings to generate comprehensive anomaly detection narratives for financial crime investigation purposes.",
          prompt: prompt,
          schema: z.object({
            anomalyNarrative: z
              .string()
              .describe(
                "Comprehensive anomaly detection narrative in Indonesian, 1200-1500 words, integrating red flag findings",
              ),
            integratedRedFlagNarrative: z
              .string()
              .describe(
                "Comprehensive narrative integrating all red flag findings into the anomaly analysis",
              ),
            riskLevel: z
              .enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
              .describe(
                "Overall risk assessment based on discrepancies and red flags",
              ),
            keyFindings: z
              .array(z.string())
              .describe("List of key anomalies and red flags detected"),
            economicImpact: z
              .number()
              .describe("Estimated economic impact in IDR"),
            investigationPriority: z
              .enum(["URGENT", "HIGH", "MEDIUM", "LOW"])
              .describe("Priority level for investigation"),
            recommendedActions: z
              .array(z.string())
              .describe("Specific recommended actions for PPATK investigation"),
            redFlagIntegration: z
              .object({
                environmentalIssues: z
                  .array(z.string())
                  .describe("Environmental red flag issues identified"),
                financialIssues: z
                  .array(z.string())
                  .describe("Financial red flag issues identified"),
                crossCuttingConcerns: z
                  .array(z.string())
                  .describe("Issues spanning multiple red flag categories"),
                overallRedFlagSeverity: z
                  .enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
                  .describe("Overall red flag severity"),
              })
              .describe("Red flag integration summary"),
          }),
        })
          .then((result) => {
            ctx.writer.write({
              id: anomalyId,
              type: "data-anomaly-detection",
              data: {
                name: `AI Anomaly Detection with Red Flags - ${analysisData.project}`,
                state: "completed",
                anomalyNarrative: result.object.anomalyNarrative,
                integratedRedFlagNarrative:
                  result.object.integratedRedFlagNarrative,
                riskLevel: result.object.riskLevel,
                keyFindings: result.object.keyFindings,
                economicImpact: result.object.economicImpact,
                investigationPriority: result.object.investigationPriority,
                recommendedActions: result.object.recommendedActions,
                redFlagIntegration: result.object.redFlagIntegration,
                analysisMetrics: {
                  discrepancyPercentage: analysisData.avgDiscrepancy,
                  discrepancyValue: discrepancyValue,
                  totalLCAM: analysisData.totalLCAM,
                  totalAI: analysisData.totalAI,
                },
                projectInfo: {
                  name: analysisData.project,
                  owner: analysisData.owner,
                  location: analysisData.location,
                  area: analysisData.area,
                  years: analysisData.years,
                },
                redFlagSources: {
                  integratedCriticalFindings: !!integratedRedFlags,
                  environmentalRedFlag1:
                    !!individualRedFlags.environmentalRedFlag1,
                  environmentalRedFlag2:
                    !!individualRedFlags.environmentalRedFlag2,
                  financialRedFlag1: !!individualRedFlags.financialRedFlag1,
                  financialRedFlag2: !!individualRedFlags.financialRedFlag2,
                  totalRedFlagsUsed: [
                    integratedRedFlags,
                    individualRedFlags.environmentalRedFlag1,
                    individualRedFlags.environmentalRedFlag2,
                    individualRedFlags.financialRedFlag1,
                    individualRedFlags.financialRedFlag2,
                  ].filter(Boolean).length,
                },
                focusArea: focusArea,
                includeRedFlags: includeRedFlags,
                generatedAt: new Date().toISOString(),
                dataSourcesUsed: {
                  carbonAnalysis: !!carbonData,
                  lcamDocument: !!lcamData,
                  comparison: !!comparisonData,
                  redFlagAnalysis: includeRedFlags,
                },
              },
            });

            return {
              success: true,
              message: `AI-powered anomaly detection with integrated red flags completed for ${analysisData.project}`,
              anomalyId,
              summary: {
                projectName: analysisData.project,
                riskLevel: result.object.riskLevel,
                discrepancy: `${analysisData.avgDiscrepancy.toFixed(1)}%`,
                economicImpact: `Rp ${result.object.economicImpact.toLocaleString()}`,
                investigationPriority: result.object.investigationPriority,
                redFlagSeverity:
                  result.object.redFlagIntegration.overallRedFlagSeverity,
                focusArea: focusArea,
                redFlagsIntegrated: includeRedFlags,
              },
            };
          })
          .catch((error) => {
            ctx.writer.write({
              id: anomalyId,
              type: "data-anomaly-detection",
              data: {
                name: "Error generating anomaly detection with red flags",
                state: "failed",
                error: error.message,
              },
            });
            throw new Error(
              `Failed to generate anomaly detection: ${error.message}`,
            );
          });
      } catch (error) {
        ctx.writer.write({
          id: anomalyId,
          type: "data-anomaly-detection",
          data: {
            name: "Error generating anomaly detection with red flags",
            state: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
        throw error;
      }
    },
  });
