// analyze-carbon-stock.ts (Fixed)
import type { CreateToolsContext } from "@/ai";
import { tool } from "ai";
import { ulid } from "ulid";
import z from "zod";

// Import helper functions
import {
  calculateCarbonClassChanges,
  calculateCarbonStatistics,
  calculateDataBounds,
  calculatePolygonArea,
  calculateTrend,
  filterByPolygonOptimized,
  getGeoJSONSmartSearch,
  listAvailableGeoJSONLayers,
  loadCSVFromPublic,
  parseCSVCoordinates,
  reclassifyToCarbon,
  validateGeoJSONForMeasurement,
} from "./carbon-analyze-helper";

export const analyzeCarbonStock = (ctx: CreateToolsContext) =>
  tool({
    name: "analyze-carbon-stock",
    description:
      "Analyze carbon stock for multiple years (2020-2024) with 2019 as baseline within GeoJSON boundary - shows all years in one comprehensive analysis",
    inputSchema: z.object({
      years: z
        .array(z.number())
        .default([2020, 2021, 2022, 2023, 2024])
        .nullable()
        .describe(
          "Array of years to analyze (e.g., [2020, 2021, 2022, 2023, 2024]) if not specified use default",
        ),
      geojsonLayerId: z
        .string()
        .describe(
          "ID of the GeoJSON layer to use as measurement boundary, or 'latest' for most recent upload",
        ),
    }),
    execute: async ({ years, geojsonLayerId }) => {
      const measurementId = ulid();
      const measurementName = `Multi-Year Carbon Stock Analysis (${years?.join(", ")})`;

      ctx.writer.write({
        id: measurementId,
        type: "data-analyze-carbon-stock",
        data: {
          name: `Processing: ${measurementName}`,
          state: "in-progress",
        },
      });

      try {
        // Handle null years parameter
        const yearsToAnalyze = years || [2020, 2021, 2022, 2023, 2024];

        // Load baseline data (previous year for each analysis year)
        const baselineData: Record<number, string> = {};
        for (const year of yearsToAnalyze) {
          const baselineYear = year - 1;
          const csvData = await loadCSVFromPublic(baselineYear);
          if (csvData) {
            baselineData[baselineYear] = csvData;
          }
        }

        // Load yearly data
        const yearlyData: Record<number, string> = {};
        for (const year of yearsToAnalyze) {
          const csvData = await loadCSVFromPublic(year);
          if (csvData) {
            yearlyData[year] = csvData;
          }
        }

        const availableYears = Object.keys(yearlyData).map(Number);
        if (availableYears.length === 0) {
          throw new Error(
            `No LULC data found for any of the specified years: ${yearsToAnalyze.join(", ")}`,
          );
        }

        // Get GeoJSON boundary
        const geojsonBounds = getGeoJSONSmartSearch(
          ctx.chat.id,
          geojsonLayerId,
        );
        if (!geojsonBounds) {
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

        const validation = validateGeoJSONForMeasurement(geojsonBounds);
        if (!validation.valid) {
          throw new Error(
            `Invalid GeoJSON for measurement: ${validation.error}`,
          );
        }

        // Process baseline data for each year (similar to yearlyData processing)
        const baselineResults: Record<number, any> = {};
        for (const baselineYear of Object.keys(baselineData).map(Number)) {
          const coordinates = parseCSVCoordinates(baselineData[baselineYear]);
          const carbonData = reclassifyToCarbon(coordinates);
          const filteredData = filterByPolygonOptimized(
            carbonData,
            geojsonBounds,
          );

          if (filteredData.length > 0) {
            const stats = calculateCarbonStatistics(filteredData);
            baselineResults[baselineYear] = {
              stats,
              totalPoints: filteredData.length,
              filteredData,
            };
          }
        }

        const measurementArea = calculatePolygonArea(geojsonBounds);

        // Process all yearly data and compare with baseline
        const yearlyResults: Record<number, any> = {};
        const timeSeriesData: Array<{
          year: number;
          baselineYear: number;
          carbonStocks: number;
          baselineCarbonStocks: number;
          forestGrowth: number;
          leakage: number;
          netSequestration: number;
          minMarketableCredits: number;
          maxMarketableCredits: number;
          yearsSinceBaseline: number;
          cumulativeGrowth: number;
          annualGrowthRate: number;
        }> = [];

        for (const year of availableYears.sort()) {
          const baselineYear = year - 1;

          // Skip if no baseline data available for this year
          if (!baselineResults[baselineYear]) {
            console.warn(
              `No baseline data found for year ${baselineYear}, skipping analysis for ${year}...`,
            );
            continue;
          }

          const coordinates = parseCSVCoordinates(yearlyData[year]);
          const carbonData = reclassifyToCarbon(coordinates);
          const filteredData = filterByPolygonOptimized(
            carbonData,
            geojsonBounds,
          );

          if (filteredData.length === 0) {
            console.warn(
              `No data points found for year ${year} within boundary, skipping...`,
            );
            continue;
          }

          const yearStats = calculateCarbonStatistics(filteredData);
          const baselineStats = baselineResults[baselineYear].stats;

          // Calculate metrics by comparing with baseline
          const yearsSinceBaseline = 1; // Always 1 year difference
          const totalGrowth = yearStats.totalCarbon - baselineStats.totalCarbon;
          const annualGrowthRate =
            baselineStats.totalCarbon > 0
              ? (totalGrowth / baselineStats.totalCarbon) * 100
              : 0;

          const forestGrowth = totalGrowth; // Direct comparison between year and baseline
          const leakage = forestGrowth > 0 ? forestGrowth * 0.1 : 0; // 10% of positive forest growth only
          const netSequestration = forestGrowth - leakage;

          const minMarketableCredits =
            netSequestration > 0 ? netSequestration * 30000 : 0;
          const maxMarketableCredits =
            netSequestration > 0 ? netSequestration * 70000 : 0;

          yearlyResults[year] = {
            stats: yearStats,
            baselineStats,
            totalPoints: filteredData.length,
            baselineTotalPoints: baselineResults[baselineYear].totalPoints,
            metrics: {
              area: measurementArea,
              carbonStocks: yearStats.totalCarbon,
              baselineCarbonStocks: baselineStats.totalCarbon,
              forestGrowth,
              leakage,
              netSequestration,
              minMarketableCredits,
              maxMarketableCredits,
              yearsSinceBaseline,
              cumulativeGrowth: totalGrowth,
              annualGrowthRate,
            },
          };

          timeSeriesData.push({
            year,
            baselineYear,
            carbonStocks: yearStats.totalCarbon,
            baselineCarbonStocks: baselineStats.totalCarbon,
            forestGrowth,
            leakage,
            netSequestration,
            minMarketableCredits,
            maxMarketableCredits,
            yearsSinceBaseline,
            cumulativeGrowth: totalGrowth,
            annualGrowthRate,
          });
        }

        if (timeSeriesData.length === 0) {
          throw new Error("No valid year-baseline pairs found for analysis");
        }

        // Calculate summary metrics
        const summaryMetrics = {
          totalYearsAnalyzed: timeSeriesData.length,
          averageAnnualGrowth:
            timeSeriesData.reduce((sum, data) => sum + data.forestGrowth, 0) /
            timeSeriesData.length,
          totalCumulativeGrowth: timeSeriesData.reduce(
            (sum, data) => sum + data.cumulativeGrowth,
            0,
          ),
          averageNetSequestration:
            timeSeriesData.reduce(
              (sum, data) => sum + data.netSequestration,
              0,
            ) / timeSeriesData.length,
          totalMinMarketableCredits: timeSeriesData.reduce(
            (sum, data) => sum + data.minMarketableCredits,
            0,
          ),
          totalMaxMarketableCredits: timeSeriesData.reduce(
            (sum, data) => sum + data.maxMarketableCredits,
            0,
          ),
          totalNetSequestration: timeSeriesData.reduce(
            (sum, data) => sum + data.netSequestration,
            0,
          ),
          bestPerformingYear: timeSeriesData.reduce(
            (best, current) =>
              current.netSequestration > best.netSequestration ? current : best,
            timeSeriesData[0],
          ),
          worstPerformingYear: timeSeriesData.reduce(
            (worst, current) =>
              current.netSequestration < worst.netSequestration
                ? current
                : worst,
            timeSeriesData[0],
          ),
          trends: {
            growthTrend: calculateTrend(
              timeSeriesData.map((d) => ({
                year: d.year,
                value: d.forestGrowth,
              })),
            ),
            sequestrationTrend: calculateTrend(
              timeSeriesData.map((d) => ({
                year: d.year,
                value: d.netSequestration,
              })),
            ),
          },
        };

        // Calculate carbon class changes using the first available baseline
        const firstBaselineYear = Math.min(
          ...Object.keys(baselineResults).map(Number),
        );
        const carbonClassAnalysis = calculateCarbonClassChanges(
          baselineResults[firstBaselineYear].stats,
          yearlyResults,
        );

        // Create summary for the response
        const summary = {
          totalYearsAnalyzed: timeSeriesData.length,
          averageAnnualGrowth: summaryMetrics.averageAnnualGrowth,
          totalNetSequestration: timeSeriesData.reduce(
            (sum, data) => sum + data.netSequestration,
            0,
          ),
          estimatedCreditsRange: {
            min: summaryMetrics.totalMinMarketableCredits,
            max: summaryMetrics.totalMaxMarketableCredits,
          },
        };

        ctx.writer.write({
          id: measurementId,
          type: "data-analyze-carbon-stock",
          data: {
            name: measurementName,
            state: "completed",
            baselineYear: firstBaselineYear,
            analyzedYears: availableYears,
            requestedYears: yearsToAnalyze,
            baselineYears: Object.keys(baselineResults).map(Number),
            geojsonLayerId,
            baselineStats: baselineResults[firstBaselineYear].stats,
            yearlyResults,
            baselineResults,
            timeSeriesData,
            summaryMetrics,
            carbonClassAnalysis,
            bounds: calculateDataBounds(
              Object.values(baselineResults)[0]?.filteredData || [],
            ),
            measurementArea,
            summary,
            metadata: {
              analysisDate: new Date().toISOString(),
              totalDataPoints: Object.values(yearlyResults).reduce(
                (sum, year) => sum + year.totalPoints,
                0,
              ),
              totalBaselinePoints: Object.values(baselineResults).reduce(
                (sum, baseline) => sum + baseline.totalPoints,
                0,
              ),
              dataQuality: assessDataQuality(yearlyResults),
              yearBaselinePairs: timeSeriesData.length,
            },
          },
        });

        const resultSummary = [
          `Multi-year carbon stock analysis completed for ${availableYears.length} years (${availableYears.join(", ")}).`,
          `Year-baseline pairs analyzed: ${timeSeriesData.length}`,
          `Measurement area: ${measurementArea.toFixed(2)} ha`,
          `Total net sequestration: ${summaryMetrics.totalNetSequestration.toLocaleString()} Mg C`,
          `Average annual growth: ${summaryMetrics.averageAnnualGrowth.toLocaleString()} Mg C/year`,
          `Average net sequestration: ${summaryMetrics.averageNetSequestration.toLocaleString()} Mg C/year`,
          `Best performing year: ${summaryMetrics.bestPerformingYear.year} (${summaryMetrics.bestPerformingYear.netSequestration.toLocaleString()} Mg C net sequestration)`,
          `Worst performing year: ${summaryMetrics.worstPerformingYear.year} (${summaryMetrics.worstPerformingYear.netSequestration.toLocaleString()} Mg C net sequestration)`,
          `Estimated credits range: ${summary.estimatedCreditsRange.min.toLocaleString()} - ${summary.estimatedCreditsRange.max.toLocaleString()}`,
        ].join("\n");

        return resultSummary;
      } catch (error) {
        ctx.writer.write({
          id: measurementId,
          type: "data-analyze-carbon-stock",
          data: {
            name: `Error: ${measurementName}`,
            state: "failed",
            error:
              error instanceof Error
                ? error.message
                : "Failed to perform multi-year analysis",
          },
        });

        throw error;
      }
    },
  });

// Helper function for data quality assessment
function assessDataQuality(yearlyResults: Record<number, any>): string {
  const years = Object.keys(yearlyResults);
  if (years.length === 0) return "no_data";
  if (years.length < 3) return "limited";
  if (years.length >= 5) return "excellent";
  return "good";
}
