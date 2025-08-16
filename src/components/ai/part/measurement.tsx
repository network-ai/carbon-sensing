import { Card } from "@/components/ui/card";
import { LULC_LABELS } from "@/utils/carbon-mappings";
import { cn } from "@/utils/classnames";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
  TreePine,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { type FC, useState } from "react";
import type { ToolPart } from ".";

// Enhanced types for multi-year analysis
interface CarbonStats {
  totalCarbon: number;
  averageCarbon: number;
  maxCarbon: number;
  minCarbon: number;
  carbonByClass: Record<
    number,
    {
      count: number;
      totalCarbon: number;
      averageCarbon: number;
    }
  >;
  totalArea: number; // in hectares
  pixelCount: number;
}

interface TimeSeriesDataPoint {
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
}

interface SummaryMetrics {
  totalYearsAnalyzed: number;
  averageAnnualGrowth: number;
  totalCumulativeGrowth: number;
  averageNetSequestration: number;
  totalMinMarketableCredits: number;
  totalMaxMarketableCredits: number;
  totalNetSequestration: number;
  bestPerformingYear: {
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
  };
  worstPerformingYear: {
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
  };
  trends: {
    growthTrend: string;
    sequestrationTrend: string;
  };
}

interface YearlyAnalysisResult {
  stats: CarbonStats;
  baselineStats: CarbonStats;
  metrics: {
    area: number;
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
  };
}

interface MultiYearCarbonAnalysisData {
  name: string;
  state: "in-progress" | "failed" | "completed";
  error?: string;
  progress?: number;
  totalSteps?: number;
  currentStep?: string;
  baselineYear?: number;
  analyzedYears?: number[];
  requestedYears?: number[];
  baselineYears?: number[];
  geojsonLayerId?: string;
  baselineStats?: CarbonStats;
  yearlyResults?: Record<number, YearlyAnalysisResult>;
  baselineResults?: Record<number, YearlyAnalysisResult>;
  timeSeriesData?: TimeSeriesDataPoint[];
  summaryMetrics?: SummaryMetrics;
  carbonClassAnalysis?: Record<string, any>;
  bounds?: number[];
  measurementArea?: number;
  summary?: {
    totalYearsAnalyzed: number;
    averageAnnualGrowth: number;
    totalNetSequestration: number;
    estimatedCreditsRange: {
      min: number;
      max: number;
    };
  };
  metadata?: {
    analysisDate: string;
    totalDataPoints: number;
    totalBaselinePoints: number;
    dataQuality: string;
    yearBaselinePairs: number;
  };
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "accelerating":
    case "improving":
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case "decelerating":
    case "declining":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Activity className="h-4 w-4 text-blue-500" />;
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case "accelerating":
    case "improving":
      return "text-green-600";
    case "decelerating":
    case "declining":
      return "text-red-600";
    default:
      return "text-blue-600";
  }
};

const getDataQualityColor = (quality: string) => {
  switch (quality) {
    case "excellent":
      return "text-green-600 bg-green-50";
    case "good":
      return "text-blue-600 bg-blue-50";
    case "limited":
      return "text-yellow-600 bg-yellow-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export const Measurement: FC<{
  part: ToolPart<"data-analyze-carbon-stock">;
  className?: string;
}> = ({ part, className }) => {
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    baseline: false,
    yearly: false,
    trends: false,
    lulc: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // State: In Progress
  if (part.data.state === "in-progress") {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div className="flex-1">
            <h4 className="font-medium">{part.data.name}</h4>
            <p className="text-sm text-muted-foreground">
              Analyzing carbon stock data...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // State: Failed
  if (part.data.state === "failed") {
    return (
      <Card className={cn("p-4 border-destructive", className)}>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <div className="flex-1">
            <h4 className="font-medium text-destructive">{part.data.name}</h4>
            <p className="text-sm text-muted-foreground">
              Error:{" "}
              {part.data.error || "Failed to analyze multi-year carbon stock"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // State: Completed
  if (part.data.state !== "completed") {
    return null;
  }

  const {
    name,
    baselineYear,
    analyzedYears,
    baselineYears,
    baselineStats,
    yearlyResults,
    baselineResults,
    timeSeriesData,
    summaryMetrics,
    measurementArea,
    summary,
    metadata,
  } = part.data;

  if (!analyzedYears || !yearlyResults || !summaryMetrics || !timeSeriesData) {
    return null;
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <TreePine className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <h4 className="font-medium">{name}</h4>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{analyzedYears.length} years analyzed</span>
              <span>•</span>
              <span>{baselineYears?.length || 0} baseline years</span>
              <span>•</span>
              <span>{measurementArea?.toFixed(1)} ha</span>
              <span>•</span>
              <span
                className={`px-2 py-1 rounded text-xs ${getDataQualityColor(metadata?.dataQuality || "unknown")}`}
              >
                {metadata?.dataQuality || "unknown"} quality
              </span>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleSection("summary")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Summary Metrics</span>
            </div>
            {expandedSections.summary ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {expandedSections.summary && (
            <div className="p-3 border-t bg-gray-50/50">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Total Net Sequestration
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {summaryMetrics.totalNetSequestration.toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      Mg C
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Avg Annual Growth
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {summaryMetrics.averageAnnualGrowth.toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      Mg C/yr
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Avg Net Sequestration
                  </div>
                  <div className="text-lg font-bold text-emerald-600">
                    {summaryMetrics.averageNetSequestration.toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      Mg C/yr
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Year-Baseline Pairs
                  </div>
                  <div className="text-lg font-bold text-orange-600">
                    {metadata?.yearBaselinePairs || timeSeriesData.length}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      pairs
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Comparison */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Best Performing Year
                    </span>
                  </div>
                  <div className="text-xl font-bold text-green-700">
                    {summaryMetrics.bestPerformingYear.year}
                  </div>
                  <div className="text-sm text-green-600">
                    {summaryMetrics.bestPerformingYear.netSequestration.toFixed(
                      1,
                    )}{" "}
                    Mg C net sequestration
                  </div>
                  <div className="text-xs text-green-500">
                    vs baseline {summaryMetrics.bestPerformingYear.baselineYear}
                  </div>
                </div>

                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      Worst Performing Year
                    </span>
                  </div>
                  <div className="text-xl font-bold text-red-700">
                    {summaryMetrics.worstPerformingYear.year}
                  </div>
                  <div className="text-sm text-red-600">
                    {summaryMetrics.worstPerformingYear.netSequestration.toFixed(
                      1,
                    )}{" "}
                    Mg C net sequestration
                  </div>
                  <div className="text-xs text-red-500">
                    vs baseline{" "}
                    {summaryMetrics.worstPerformingYear.baselineYear}
                  </div>
                </div>
              </div>

              {/* Credits Range */}
              {summary && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-purple-800">
                      Total Estimated Credits Range
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    Rp. {summary.estimatedCreditsRange.min.toLocaleString()} -
                    Rp. {summary.estimatedCreditsRange.max.toLocaleString()}
                  </div>
                </div>
              )}

              {/* Trends */}
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {getTrendIcon(summaryMetrics.trends.growthTrend)}
                    <span className="text-sm font-medium text-blue-800">
                      Growth Trend
                    </span>
                  </div>
                  <div
                    className={`text-lg font-bold ${getTrendColor(summaryMetrics.trends.growthTrend)}`}
                  >
                    {summaryMetrics.trends.growthTrend.charAt(0).toUpperCase() +
                      summaryMetrics.trends.growthTrend.slice(1)}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {getTrendIcon(summaryMetrics.trends.sequestrationTrend)}
                    <span className="text-sm font-medium text-emerald-800">
                      Sequestration Trend
                    </span>
                  </div>
                  <div
                    className={`text-lg font-bold ${getTrendColor(summaryMetrics.trends.sequestrationTrend)}`}
                  >
                    {summaryMetrics.trends.sequestrationTrend
                      .charAt(0)
                      .toUpperCase() +
                      summaryMetrics.trends.sequestrationTrend.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Baseline Section - Multiple Baselines */}
        {baselineResults && Object.keys(baselineResults).length > 0 && (
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection("baseline")}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">
                  Result By Year ({baselineYears?.join(", ")})
                </span>
              </div>
              {expandedSections.baseline ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {expandedSections.baseline && (
              <div className="p-3 border-t bg-gray-50/50 space-y-3">
                {Object.entries(baselineResults).map(([year, result]) => (
                  <div
                    key={`baseline-${year}`}
                    className="bg-white p-3 rounded border"
                  >
                    <h5 className="font-medium mb-2">Baseline Year {year}</h5>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Total Carbon
                        </div>
                        <div className="text-lg font-semibold">
                          {result.stats.totalCarbon.toLocaleString()} Mg C
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Average Carbon
                        </div>
                        <div className="text-lg font-semibold">
                          {result.stats.averageCarbon.toFixed(1)} Mg C/ha
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Data Points
                        </div>
                        <div className="text-lg font-semibold">
                          {result.totalPoints.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Max Carbon
                        </div>
                        <div className="text-lg font-semibold">
                          {result.stats.maxCarbon.toLocaleString()} Mg C/ha
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Yearly Results Section */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleSection("yearly")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Year-to-Baseline Comparisons</span>
            </div>
            {expandedSections.yearly ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {expandedSections.yearly && (
            <div className="p-3 border-t bg-gray-50/50 space-y-3">
              {timeSeriesData.map((yearData) => (
                <div
                  key={`${yearData.year}-${yearData.baselineYear}`}
                  className="bg-white p-3 rounded border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">
                      Year {yearData.year} vs Baseline {yearData.baselineYear}
                    </h5>
                    <span className="text-xs text-muted-foreground">
                      {yearData.yearsSinceBaseline} year
                      {yearData.yearsSinceBaseline !== 1 ? "s" : ""} difference
                    </span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Carbon Stocks:
                      </span>
                      <div className="font-semibold">
                        {yearData.carbonStocks.toLocaleString()} Mg C
                      </div>
                      <div className="text-xs text-gray-500">
                        Baseline:{" "}
                        {yearData.baselineCarbonStocks.toLocaleString()} Mg C
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Forest Growth:
                      </span>
                      <div
                        className={`font-semibold ${yearData.forestGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {yearData.forestGrowth > 0 ? "+" : ""}
                        {yearData.forestGrowth.toFixed(1)} Mg C
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Net Sequestration:
                      </span>
                      <div
                        className={`font-semibold ${yearData.netSequestration >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {yearData.netSequestration > 0 ? "+" : ""}
                        {yearData.netSequestration.toFixed(1)} Mg C
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Leakage:</span>
                      <div className="font-semibold text-orange-600">
                        {yearData.leakage.toFixed(1)} Mg C
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Annual Growth Rate:
                      </span>
                      <div
                        className={`font-semibold ${yearData.annualGrowthRate >= 0 ? "text-blue-600" : "text-red-600"}`}
                      >
                        {yearData.annualGrowthRate > 0 ? "+" : ""}
                        {yearData.annualGrowthRate.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Credits Range:
                      </span>
                      <div className="font-semibold text-green-700">
                        ${yearData.minMarketableCredits.toLocaleString()} - $
                        {yearData.maxMarketableCredits.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LULC Distribution Section */}
        {(baselineResults || yearlyResults) && (
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection("lulc")}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <span className="font-medium">
                  Distribusi Penggunaan Lahan (LULC)
                </span>
              </div>
              {expandedSections.lulc ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {expandedSections.lulc && (
              <div className="p-3 border-t bg-gray-50/50 space-y-4">
                {/* Baseline LULC - Multiple Baselines */}
                {baselineResults &&
                  Object.entries(baselineResults).map(
                    ([baselineYear, baselineData]) => (
                      <div
                        key={`baseline-lulc-${baselineYear}`}
                        className="bg-blue-50 p-3 rounded-lg"
                      >
                        <h6 className="font-medium text-blue-800 mb-3 flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Baseline {baselineYear}
                          </div>
                          <span className="text-xs text-blue-600">
                            {baselineData.totalPoints.toLocaleString()} data
                            points
                          </span>
                        </h6>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {Object.entries(
                            baselineData.stats.carbonByClass || {},
                          )
                            .sort(
                              ([, a], [, b]) =>
                                (b as any).totalCarbon - (a as any).totalCarbon,
                            )
                            // .slice(0, 8) // Show top 8 classes
                            .map(([lulcClass, data]) => (
                              <div
                                key={`baseline-${baselineYear}-${lulcClass}`}
                                className="flex justify-between items-center text-sm bg-white p-2 rounded border"
                              >
                                <div>
                                  <div className="font-medium">
                                    {LULC_LABELS[parseInt(lulcClass)] ||
                                      `Class ${lulcClass}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {(data as any).count.toLocaleString()}{" "}
                                    pixels
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold">
                                    {(data as any).totalCarbon.toLocaleString()}{" "}
                                    Mg C
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {(data as any).averageCarbon.toFixed(1)} Mg
                                    C/ha avg
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ),
                  )}

                {/* Yearly LULC Distributions with Baseline Comparisons */}
                {yearlyResults &&
                  Object.keys(yearlyResults).map((year) => {
                    const yearNum = parseInt(year);
                    const yearData = yearlyResults[yearNum];
                    const baselineYear = yearNum - 1;
                    const baselineData = baselineResults?.[baselineYear];

                    if (!yearData?.stats?.carbonByClass) return null;

                    return (
                      <div
                        key={`year-lulc-${year}`}
                        className="bg-green-50 p-3 rounded-lg"
                      >
                        <h6 className="font-medium text-green-800 mb-3 flex items-center gap-2 justify-between">
                          <div className="flex items-center gap-2">
                            <TreePine className="h-4 w-4" />
                            Year {year}{" "}
                            {baselineData && `vs Baseline ${baselineYear}`}
                          </div>
                          <span className="text-xs text-green-600">
                            {yearData.totalPoints.toLocaleString()} data points
                            {yearData.baselineTotalPoints && (
                              <span className="ml-2 text-gray-500">
                                (baseline:{" "}
                                {yearData.baselineTotalPoints.toLocaleString()})
                              </span>
                            )}
                          </span>
                        </h6>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {Object.entries(yearData.stats.carbonByClass)
                            .sort(
                              ([, a], [, b]) =>
                                (b as any).totalCarbon - (a as any).totalCarbon,
                            )
                            // .slice(0, 8) // Show top 8 classes
                            .map(([lulcClass, data]) => {
                              // Calculate change from corresponding baseline if available
                              const baselineClassData =
                                yearData.baselineStats?.carbonByClass?.[
                                  parseInt(lulcClass)
                                ];
                              const carbonChange = baselineClassData
                                ? (data as any).totalCarbon -
                                  baselineClassData.totalCarbon
                                : null;
                              const carbonChangePercent = baselineClassData
                                ? (carbonChange! /
                                    baselineClassData.totalCarbon) *
                                  100
                                : null;

                              return (
                                <div
                                  key={`${year}-lulc-${lulcClass}`}
                                  className="flex justify-between items-center text-sm bg-white p-2 rounded border"
                                >
                                  <div>
                                    <div className="font-medium">
                                      {LULC_LABELS[parseInt(lulcClass)] ||
                                        `Class ${lulcClass}`}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {(data as any).count.toLocaleString()}{" "}
                                      pixels
                                      {baselineClassData &&
                                        carbonChangePercent !== null && (
                                          <span
                                            className={`ml-2 px-1 rounded text-xs ${
                                              carbonChangePercent > 0
                                                ? "bg-green-100 text-green-700"
                                                : carbonChangePercent < 0
                                                  ? "bg-red-100 text-red-700"
                                                  : "bg-gray-100 text-gray-700"
                                            }`}
                                          >
                                            {carbonChangePercent > 0 ? "+" : ""}
                                            {carbonChangePercent.toFixed(1)}%
                                          </span>
                                        )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold">
                                      {(
                                        data as any
                                      ).totalCarbon.toLocaleString()}{" "}
                                      Mg C
                                      {carbonChange !== null && (
                                        <span
                                          className={`ml-1 text-xs ${
                                            carbonChange > 0
                                              ? "text-green-600"
                                              : carbonChange < 0
                                                ? "text-red-600"
                                                : "text-gray-600"
                                          }`}
                                        >
                                          ({carbonChange > 0 ? "+" : ""}
                                          {carbonChange.toFixed(0)})
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {(data as any).averageCarbon.toFixed(1)}{" "}
                                      Mg C/ha avg
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}

                {/* Summary of Changes */}
                {yearlyResults && Object.keys(yearlyResults).length > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h6 className="font-medium text-purple-800 mb-2">
                      Key LULC Changes Summary
                    </h6>
                    <div className="text-sm text-purple-700">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {/* Find classes with biggest changes across all years */}
                        {(() => {
                          const allChanges: Array<{
                            year: number;
                            classId: string;
                            className: string;
                            change: number;
                            changePercent: number;
                          }> = [];

                          Object.entries(yearlyResults).forEach(
                            ([year, yearData]) => {
                              if (!yearData.baselineStats) return;

                              Object.entries(
                                yearData.stats.carbonByClass || {},
                              ).forEach(([classId, data]) => {
                                const baseline =
                                  yearData.baselineStats.carbonByClass[
                                    parseInt(classId)
                                  ];
                                if (!baseline) return;

                                const change =
                                  (data as any).totalCarbon -
                                  baseline.totalCarbon;
                                const changePercent =
                                  (change / baseline.totalCarbon) * 100;

                                allChanges.push({
                                  year: parseInt(year),
                                  classId,
                                  className:
                                    LULC_LABELS[parseInt(classId)] ||
                                    `Class ${classId}`,
                                  change,
                                  changePercent,
                                });
                              });
                            },
                          );

                          if (allChanges.length === 0) return null;

                          // Find most significant positive and negative changes
                          const sortedByAbsPercent = allChanges.sort(
                            (a, b) =>
                              Math.abs(b.changePercent) -
                              Math.abs(a.changePercent),
                          );
                          const topIncrease = sortedByAbsPercent.find(
                            (c) => c.changePercent > 0,
                          );
                          const topDecrease = sortedByAbsPercent.find(
                            (c) => c.changePercent < 0,
                          );

                          return (
                            <>
                              {topIncrease && (
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-3 w-3 text-green-600" />
                                  <span className="text-xs">
                                    <strong>{topIncrease.className}</strong> (
                                    {topIncrease.year}): +
                                    {topIncrease.changePercent.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                              {topDecrease && (
                                <div className="flex items-center gap-2">
                                  <TrendingDown className="h-3 w-3 text-red-600" />
                                  <span className="text-xs">
                                    <strong>{topDecrease.className}</strong> (
                                    {topDecrease.year}):{" "}
                                    {topDecrease.changePercent.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
