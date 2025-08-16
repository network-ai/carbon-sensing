// compare-carbon-credits.ts (Cleaned)
import type { CreateToolsContext } from "@/ai";
import { tool } from "ai";
import { ulid } from "ulid";
import z from "zod";

// Import helper functions
import {
  calculateDiscrepancy,
  findCarbonStockAnalysis,
  findLCAMExtraction,
  matchPeriodsAndYears,
} from "./carbon-analyze-helper";

export const compareMarketableCarbonCredits = (ctx: CreateToolsContext) =>
  tool({
    name: "compare-marketable-carbon-credits",
    description:
      "Compare marketable carbon credits from carbon stock analysis with LCAM assessment data to evaluate accuracy and discrepancies",
    inputSchema: z.object({
      carbonStockAnalysisId: z
        .string()
        .optional()
        .nullable()
        .describe(
          "ID of specific carbon stock analysis to use (default: use latest)",
        ),
      lcamDocumentId: z
        .string()
        .optional()
        .nullable()
        .describe(
          "ID of specific LCAM document extraction to use (default: use latest)",
        ),
      analysisYears: z
        .array(z.number())
        .optional()
        .nullable()
        .describe("Specific years to compare (default: all matching years)"),
      includeDetailedBreakdown: z
        .boolean()
        .default(true)
        .describe("Include detailed year-by-year breakdown"),
    }),
    execute: async ({
      carbonStockAnalysisId,
      lcamDocumentId,
      analysisYears,
      includeDetailedBreakdown,
    }) => {
      const comparisonId = ulid();
      const comparisonName = "Marketable Carbon Credits Comparison";

      ctx.writer.write({
        id: comparisonId,
        type: "data-compare-carbon-credits",
        data: {
          name: `Processing: ${comparisonName}`,
          state: "in-progress",
        },
      });

      const creditPriceRange = { min: 30000, max: 70000 };
      try {
        // Find carbon stock analysis data
        const carbonStockData = findCarbonStockAnalysis(
          ctx.chat.id,
          carbonStockAnalysisId,
        );
        if (!carbonStockData) {
          throw new Error(
            "No carbon stock analysis found. Please run analyze-carbon-stock first.",
          );
        }

        // Find LCAM extraction data
        const lcamData = findLCAMExtraction(ctx.chat.id, lcamDocumentId);
        if (!lcamData) {
          throw new Error(
            "No LCAM extraction found. Please upload and process LCAM document first.",
          );
        }

        // Match periods and years between datasets
        const matchedData = matchPeriodsAndYears(carbonStockData, lcamData);

        if (matchedData.length === 0) {
          throw new Error(
            "No matching years found between carbon stock analysis and LCAM data.",
          );
        }

        // Filter by specific years if requested
        const filteredData =
          analysisYears && analysisYears.length > 0
            ? matchedData.filter((data) => analysisYears.includes(data.year))
            : matchedData;

        if (filteredData.length === 0) {
          throw new Error(
            `No data found for specified years: ${analysisYears?.join(", ") || "all available years"}`,
          );
        }

        // Perform detailed comparison
        const comparisonResults = filteredData.map((yearData) => {
          // Primary comparison: Net Sequestration vs LCAM Reduction (in ton CO2e)
          const discrepancyNetSequestration = calculateDiscrepancy(
            yearData.lcam.pengurangan_emisi_grk || 0,
            yearData.carbonStock.netSequestration,
          );
          // Convert net sequestration to marketable credits for comparison
          const carbonStockMarketableMin =
            yearData.carbonStock.netSequestration * creditPriceRange.min;
          const carbonStockMarketableMax =
            yearData.carbonStock.netSequestration * creditPriceRange.max;

          // Convert LCAM reduction to marketable credits
          const lcamMarketableMin =
            (yearData.lcam.pengurangan_emisi_grk || 0) * creditPriceRange.min;
          const lcamMarketableMax =
            (yearData.lcam.pengurangan_emisi_grk || 0) * creditPriceRange.max;

          // Calculate marketable credits discrepancies
          const discrepancyMarketableCreditsMin = calculateDiscrepancy(
            lcamMarketableMin,
            carbonStockMarketableMin,
          );

          const discrepancyMarketableCreditsMax = calculateDiscrepancy(
            lcamMarketableMax,
            carbonStockMarketableMax,
          );

          return {
            year: yearData.year,
            period: yearData.period,
            carbonStock: {
              ...yearData.carbonStock,
              marketableCreditsMin: carbonStockMarketableMin,
              marketableCreditsMax: carbonStockMarketableMax,
            },
            lcam: {
              ...yearData.lcam,
              marketableCreditsMin: lcamMarketableMin,
              marketableCreditsMax: lcamMarketableMax,
            },
            discrepancy: {
              netSequestration: discrepancyNetSequestration,
              marketableCreditsMin: discrepancyMarketableCreditsMin,
              marketableCreditsMax: discrepancyMarketableCreditsMax,
            },
            recommendedValues: {
              netSequestrationTonCO2e: {
                conservative: Math.min(
                  yearData.carbonStock.netSequestration,
                  yearData.lcam.pengurangan_emisi_grk || 0,
                ),
                moderate:
                  (yearData.carbonStock.netSequestration +
                    (yearData.lcam.pengurangan_emisi_grk || 0)) /
                  2,
                optimistic: Math.max(
                  yearData.carbonStock.netSequestration,
                  yearData.lcam.pengurangan_emisi_grk || 0,
                ),
              },
              marketableCredits: {
                conservative: Math.min(
                  carbonStockMarketableMin,
                  lcamMarketableMin,
                ),
                moderate: (carbonStockMarketableMin + lcamMarketableMin) / 2,
                optimistic: Math.max(
                  carbonStockMarketableMax,
                  lcamMarketableMax,
                ),
              },
            },
          };
        });

        // Calculate summary statistics
        const summaryStats =
          calculateNetSequestrationDiscrepancy(comparisonResults);

        // Calculate total comparison metrics
        const totalComparison = {
          lcamTotalReduction: summaryStats.totalLCAMReduction,
          carbonStockTotalNetSequestration:
            summaryStats.totalCarbonStockNetSequestration,
          netSequestrationDiscrepancy: calculateDiscrepancy(
            summaryStats.totalLCAMReduction,
            summaryStats.totalCarbonStockNetSequestration,
          ),
          marketableCreditsComparison: {
            lcamBased: {
              min: summaryStats.totalLCAMReduction * creditPriceRange.min,
              max: summaryStats.totalLCAMReduction * creditPriceRange.max,
            },
            carbonStockBased: {
              min:
                summaryStats.totalCarbonStockNetSequestration *
                creditPriceRange.min,
              max:
                summaryStats.totalCarbonStockNetSequestration *
                creditPriceRange.max,
            },
          },
        };

        // Generate quality assessment
        const qualityAssessment = {
          dataReliability:
            summaryStats.correlationAnalysis.netSequestrationCorrelation ===
            "strong_correlation"
              ? "high"
              : summaryStats.correlationAnalysis.netSequestrationCorrelation ===
                  "moderate_correlation"
                ? "medium"
                : "low",
          recommendedApproach:
            summaryStats.averageDiscrepancyPercentage < 15
              ? "use_average_both_methods"
              : totalComparison.netSequestrationDiscrepancy.type ===
                  "overestimate"
                ? "use_carbon_sensing_conservative"
                : "use_lcam_verified",
          confidenceLevel:
            comparisonResults.length >= 3
              ? "high"
              : comparisonResults.length >= 2
                ? "medium"
                : "low",
          methodAgreement:
            summaryStats.averageDiscrepancyPercentage < 10
              ? "excellent"
              : summaryStats.averageDiscrepancyPercentage < 25
                ? "good"
                : summaryStats.averageDiscrepancyPercentage < 50
                  ? "fair"
                  : "poor",
        };

        ctx.writer.write({
          id: comparisonId,
          type: "data-compare-carbon-credits",
          data: {
            name: comparisonName,
            state: "completed",
            carbonStockSource: {
              analysisId: carbonStockAnalysisId,
              baselineYear: carbonStockData.baselineYear,
              analyzedYears: carbonStockData.analyzedYears,
              measurementArea: carbonStockData.measurementArea,
            },
            lcamSource: {
              documentId: lcamDocumentId,
              documentName:
                lcamData.informasi_umum?.judul_kegiatan || "Unknown",
              verificationBody:
                lcamData.lembaga_verifikasi?.identitas_lembaga?.nama_lembaga ||
                "Unknown",
            },
            comparisonParameters: {
              yearsCompared: filteredData.map((d) => d.year),
              creditPriceRange,
              includeDetailedBreakdown,
            },
            ...(includeDetailedBreakdown && {
              yearlyComparison: comparisonResults,
            }),
            summaryStatistics: summaryStats,
            totalComparison,
            qualityAssessment,
            recommendations: {
              netSequestrationValues:
                summaryStats.recommendedValues.netSequestrationTonCO2e,
              marketableCreditsValues:
                summaryStats.recommendedValues.marketableCredits,
              preferredMethod: qualityAssessment.recommendedApproach,
              methodAgreement: qualityAssessment.methodAgreement,
              riskAssessment: {
                overestimationRisk:
                  totalComparison.netSequestrationDiscrepancy.type ===
                    "overestimate" &&
                  Math.abs(
                    totalComparison.netSequestrationDiscrepancy.percentage,
                  ) > 25
                    ? "high"
                    : "low",
                underestimationRisk:
                  totalComparison.netSequestrationDiscrepancy.type ===
                    "underestimate" &&
                  Math.abs(
                    totalComparison.netSequestrationDiscrepancy.percentage,
                  ) > 25
                    ? "high"
                    : "low",
                dataQualityRisk:
                  qualityAssessment.dataReliability === "low" ? "high" : "low",
              },
            },
            metadata: {
              comparisonDate: new Date().toISOString(),
              totalYearsAnalyzed: comparisonResults.length,
              dataQuality: qualityAssessment.dataReliability,
              processingTime: Date.now(),
            },
          },
        });

        const summaryMessage = [
          `Carbon credits comparison completed for ${comparisonResults.length} year(s).`,
          `Total LCAM reduction: ${summaryStats.totalLCAMReduction.toLocaleString()} ton CO2e`,
          `Carbon sensing range: ${summaryStats.totalCarbonStockNetSequestration.toLocaleString()} ton CO2e`,
          `Average discrepancy: ${summaryStats.averageDiscrepancyPercentage.toFixed(1)}%`,
          `Recommended approach: ${qualityAssessment.recommendedApproach.replace(/_/g, " ")}`,
          `Data reliability: ${qualityAssessment.dataReliability}`,
        ].join("\n");

        return summaryMessage;
      } catch (error) {
        ctx.writer.write({
          id: comparisonId,
          type: "data-compare-carbon-credits",
          data: {
            name: `Error: ${comparisonName}`,
            state: "failed",
            error:
              error instanceof Error
                ? error.message
                : "Failed to compare carbon credits",
          },
        });

        throw error;
      }
    },
  });

// Helper function to calculate discrepancy metrics for net sequestration
function calculateNetSequestrationDiscrepancy(comparisonData: any[]): {
  totalYearsCompared: number;
  averageDiscrepancyPercentage: number;
  totalLCAMReduction: number;
  totalCarbonStockNetSequestration: number;
  correlationAnalysis: {
    netSequestrationCorrelation:
      | "insufficient_data"
      | "strong_correlation"
      | "moderate_correlation"
      | "weak_correlation"
      | "poor_correlation";
    marketableCreditsCorrelation:
      | "insufficient_data"
      | "strong_correlation"
      | "moderate_correlation"
      | "weak_correlation"
      | "poor_correlation";
  };
  recommendedValues: {
    netSequestrationTonCO2e: {
      conservative: number;
      moderate: number;
      optimistic: number;
    };
    marketableCredits: {
      conservative: number;
      moderate: number;
      optimistic: number;
    };
  };
} {
  const totalYears = comparisonData.length;

  const avgDiscrepancyPercentage =
    comparisonData.reduce(
      (sum, data) =>
        sum + Math.abs(data.discrepancy.netSequestration.percentage),
      0,
    ) / totalYears;

  const totalLCAM = comparisonData.reduce(
    (sum, data) => sum + (data.lcam.pengurangan_emisi_grk || 0),
    0,
  );

  const totalCarbonStock = comparisonData.reduce(
    (sum, data) => sum + data.carbonStock.netSequestration,
    0,
  );

  const getNetSequestrationCorrelation = ():
    | "insufficient_data"
    | "strong_correlation"
    | "moderate_correlation"
    | "weak_correlation"
    | "poor_correlation" => {
    if (comparisonData.length < 3) return "insufficient_data";

    if (avgDiscrepancyPercentage < 10) return "strong_correlation";
    if (avgDiscrepancyPercentage < 25) return "moderate_correlation";
    if (avgDiscrepancyPercentage < 50) return "weak_correlation";
    return "poor_correlation";
  };

  const marketableCreditsVariance =
    comparisonData.reduce((sum, data) => {
      const avgMarketable =
        (data.discrepancy.marketableCreditsMin.percentage +
          data.discrepancy.marketableCreditsMax.percentage) /
        2;
      return sum + Math.abs(avgMarketable);
    }, 0) / totalYears;

  const getMarketableCreditsCorrelation = ():
    | "insufficient_data"
    | "strong_correlation"
    | "moderate_correlation"
    | "weak_correlation"
    | "poor_correlation" => {
    if (comparisonData.length < 3) return "insufficient_data";

    if (marketableCreditsVariance < 15) return "strong_correlation";
    if (marketableCreditsVariance < 30) return "moderate_correlation";
    if (marketableCreditsVariance < 60) return "weak_correlation";
    return "poor_correlation";
  };

  const conservativeNet = Math.min(totalCarbonStock, totalLCAM);
  const moderateNet = (totalCarbonStock + totalLCAM) / 2;
  const optimisticNet = Math.max(totalCarbonStock, totalLCAM);

  const minPrice = 30000;
  const maxPrice = 70000;
  const avgPrice = (minPrice + maxPrice) / 2;

  const recommendedValues = {
    netSequestrationTonCO2e: {
      conservative: conservativeNet,
      moderate: moderateNet,
      optimistic: optimisticNet,
    },
    marketableCredits: {
      conservative: conservativeNet * minPrice,
      moderate: moderateNet * avgPrice,
      optimistic: optimisticNet * maxPrice,
    },
  };

  return {
    totalYearsCompared: totalYears,
    averageDiscrepancyPercentage: avgDiscrepancyPercentage,
    totalLCAMReduction: totalLCAM,
    totalCarbonStockNetSequestration: totalCarbonStock,
    correlationAnalysis: {
      netSequestrationCorrelation: getNetSequestrationCorrelation(),
      marketableCreditsCorrelation: getMarketableCreditsCorrelation(),
    },
    recommendedValues,
  };
}
