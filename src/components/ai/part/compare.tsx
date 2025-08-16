import { Card } from "@/components/ui/card";
import { cn } from "@/utils/classnames";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  GitCompare,
  Info,
  Loader2,
  Scale,
  Target,
} from "lucide-react";
import { type FC, useState } from "react";
import type { ToolPart } from ".";

// Enhanced types for comparison analysis
interface DiscrepancyResult {
  absolute: number;
  percentage: number;
  type: "overestimate" | "underestimate" | "matched";
}

interface CarbonStockData {
  minMarketableCredits: number;
  maxMarketableCredits: number;
  netSequestration: number;
  forestGrowth: number;
  marketableCreditsMin?: number;
  marketableCreditsMax?: number;
}

interface LCAMData {
  pengurangan_emisi_grk: number;
  emisi_baseline?: number;
  emisi_aksi_mitigasi?: number;
  kebocoran_leakage?: number;
  marketableCreditsMin?: number;
  marketableCreditsMax?: number;
}

interface YearlyComparisonResult {
  year: number;
  period?: string;
  carbonStock: CarbonStockData;
  lcam: LCAMData;
  discrepancy: {
    netSequestration: DiscrepancyResult;
    marketableCreditsMin: DiscrepancyResult;
    marketableCreditsMax: DiscrepancyResult;
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
}

interface ComparisonSummaryStatistics {
  totalYearsCompared: number;
  averageDiscrepancyPercentage: number;
  totalLCAMReduction: number;
  totalCarbonStockNetSequestration: number;
  correlationAnalysis: {
    netSequestrationCorrelation: string;
    marketableCreditsCorrelation: string;
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
}

interface CompareCarbonCreditData {
  name: string;
  state: "in-progress" | "failed" | "completed";
  error?: string;
  carbonStockSource?: {
    analysisId?: string;
    baselineYear?: number;
    analyzedYears?: number[];
    measurementArea?: number;
  };
  lcamSource?: {
    documentId?: string;
    documentName?: string;
    verificationBody?: string;
  };
  comparisonParameters?: {
    yearsCompared: number[];
    creditPriceRange: {
      min: number;
      max: number;
    };
    includeDetailedBreakdown: boolean;
  };
  yearlyComparison?: YearlyComparisonResult[];
  summaryStatistics?: ComparisonSummaryStatistics;
  totalComparison?: {
    lcamTotalReduction: number;
    carbonStockTotalNetSequestration: number;
    netSequestrationDiscrepancy: DiscrepancyResult;
    marketableCreditsComparison: {
      lcamBased: { min: number; max: number };
      carbonStockBased: { min: number; max: number };
    };
  };
  qualityAssessment?: {
    dataReliability: string;
    recommendedApproach: string;
    confidenceLevel: string;
    methodAgreement: string;
  };
  recommendations?: {
    netSequestrationValues: {
      conservative: number;
      moderate: number;
      optimistic: number;
    };
    marketableCreditsValues: {
      conservative: number;
      moderate: number;
      optimistic: number;
    };
    preferredMethod: string;
    methodAgreement: string;
    riskAssessment: {
      overestimationRisk: string;
      underestimationRisk: string;
      dataQualityRisk: string;
    };
  };
  metadata?: {
    comparisonDate: string;
    totalYearsAnalyzed: number;
    dataQuality: string;
    processingTime: number;
  };
}

const getDiscrepancyIcon = (discrepancy: DiscrepancyResult) => {
  const absPercentage = Math.abs(discrepancy.percentage);
  if (absPercentage < 10)
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (absPercentage < 25) return <Info className="h-4 w-4 text-blue-500" />;
  if (absPercentage < 50)
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <AlertCircle className="h-4 w-4 text-red-500" />;
};

const getDiscrepancyColor = (discrepancy: DiscrepancyResult) => {
  const absPercentage = Math.abs(discrepancy.percentage);
  if (absPercentage < 10) return "text-green-600 bg-green-50";
  if (absPercentage < 25) return "text-blue-600 bg-blue-50";
  if (absPercentage < 50) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

const getCorrelationIcon = (correlation: string) => {
  switch (correlation) {
    case "strong_correlation":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "moderate_correlation":
      return <Info className="h-4 w-4 text-blue-500" />;
    case "weak_correlation":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "poor_correlation":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const getReliabilityColor = (reliability: string) => {
  switch (reliability) {
    case "high":
      return "text-green-600 bg-green-50";
    case "medium":
      return "text-blue-600 bg-blue-50";
    case "low":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const getMethodAgreementColor = (agreement: string) => {
  switch (agreement) {
    case "excellent":
      return "text-green-600 bg-green-50";
    case "good":
      return "text-blue-600 bg-blue-50";
    case "fair":
      return "text-yellow-600 bg-yellow-50";
    case "poor":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export const CompareCarbonCredits: FC<{
  part: ToolPart<"data-compare-carbon-credits">;
  className?: string;
}> = ({ part, className }) => {
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    sources: false,
    yearly: false,
    quality: false,
    recommendations: false,
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
              Comparing carbon credits methodologies...
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
              Error: {part.data.error || "Failed to compare carbon credits"}
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
    carbonStockSource,
    lcamSource,
    comparisonParameters,
    yearlyComparison,
    summaryStatistics,
    totalComparison,
    qualityAssessment,
    recommendations,
    metadata,
  } = part.data;

  if (!summaryStatistics || !totalComparison || !qualityAssessment) {
    return null;
  }

  return (
    <Card className={cn("p-4", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <GitCompare className="h-5 w-5 text-purple-600" />
          <div className="flex-1">
            <h4 className="font-medium">{name}</h4>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{summaryStatistics.totalYearsCompared} years compared</span>
              <span>•</span>
              <span
                className={`px-2 py-1 rounded text-xs ${getReliabilityColor(qualityAssessment.dataReliability)}`}
              >
                {qualityAssessment.dataReliability} reliability
              </span>
              <span>•</span>
              <span
                className={`px-2 py-1 rounded text-xs ${getMethodAgreementColor(qualityAssessment.methodAgreement)}`}
              >
                {qualityAssessment.methodAgreement} agreement
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
              <span className="font-medium">Comparison Summary</span>
            </div>
            {expandedSections.summary ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {expandedSections.summary && (
            <div className="p-3 border-t bg-gray-50/50">
              {/* Main Metrics Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">
                      Carbon Sensing Analysis
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700">
                    {totalComparison.carbonStockTotalNetSequestration.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      ton CO2e
                    </span>
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    Net Sequestration Total
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">
                      LCAM Assessment
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    {totalComparison.lcamTotalReduction.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      ton CO2e
                    </span>
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Emission Reduction Total
                  </div>
                </div>
              </div>

              {/* Discrepancy Analysis */}
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">
                    Net Sequestration Discrepancy
                  </span>
                  {getDiscrepancyIcon(
                    totalComparison.netSequestrationDiscrepancy,
                  )}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Absolute Difference
                    </div>
                    <div className="text-lg font-bold">
                      {Math.abs(
                        totalComparison.netSequestrationDiscrepancy.absolute,
                      ).toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        ton CO2e
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Percentage Difference
                    </div>
                    <div
                      className={`text-lg font-bold px-2 py-1 rounded ${getDiscrepancyColor(totalComparison.netSequestrationDiscrepancy)}`}
                    >
                      {totalComparison.netSequestrationDiscrepancy.percentage.toFixed(
                        1,
                      )}
                      %
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Type</div>
                    <div className="text-lg font-bold capitalize">
                      {totalComparison.netSequestrationDiscrepancy.type.replace(
                        "_",
                        " ",
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Average Discrepancy
                    </div>
                    <div className="text-lg font-bold">
                      {summaryStatistics.averageDiscrepancyPercentage.toFixed(
                        1,
                      )}
                      %
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketable Credits Comparison */}
              <div className="bg-emerald-50 p-3 rounded-lg mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-emerald-800">
                    Marketable Credits Comparison
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-emerald-700 font-medium">
                      LCAM-Based Credits
                    </div>
                    <div className="text-xl font-bold text-emerald-600">
                      Rp.{" "}
                      {totalComparison.marketableCreditsComparison.lcamBased.min.toLocaleString()}{" "}
                      - Rp.{" "}
                      {totalComparison.marketableCreditsComparison.lcamBased.max.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-emerald-700 font-medium">
                      Carbon Stock-Based Credits
                    </div>
                    <div className="text-xl font-bold text-emerald-600">
                      Rp.{" "}
                      {totalComparison.marketableCreditsComparison.carbonStockBased.min.toLocaleString()}{" "}
                      - Rp.{" "}
                      {totalComparison.marketableCreditsComparison.carbonStockBased.max.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Sources Section */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleSection("sources")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Data Sources</span>
            </div>
            {expandedSections.sources ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {expandedSections.sources && (
            <div className="p-3 border-t bg-gray-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Carbon Stock Source */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h6 className="font-medium text-blue-800 mb-2">
                    Carbon Stock Analysis
                  </h6>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Baseline Year:
                      </span>{" "}
                      {carbonStockSource?.baselineYear}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Years Analyzed:
                      </span>{" "}
                      {carbonStockSource?.analyzedYears?.join(", ")}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Area:</span>{" "}
                      {carbonStockSource?.measurementArea?.toFixed(1)} ha
                    </div>
                  </div>
                </div>

                {/* LCAM Source */}
                <div className="bg-green-50 p-3 rounded-lg">
                  <h6 className="font-medium text-green-800 mb-2">
                    LCAM Document
                  </h6>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Document:</span>{" "}
                      {lcamSource?.documentName || "Unknown"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Verification Body:
                      </span>{" "}
                      {lcamSource?.verificationBody || "Unknown"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Years Compared:
                      </span>{" "}
                      {comparisonParameters?.yearsCompared.join(", ")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Parameters */}
              <div className="bg-purple-50 p-3 rounded-lg mt-4">
                <h6 className="font-medium text-purple-800 mb-2">
                  Comparison Parameters
                </h6>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Credit Price Range:
                    </span>
                    <div className="font-medium">
                      Rp.{" "}
                      {comparisonParameters?.creditPriceRange.min.toLocaleString()}{" "}
                      - Rp.{" "}
                      {comparisonParameters?.creditPriceRange.max.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Years Compared:
                    </span>
                    <div className="font-medium">
                      {summaryStatistics.totalYearsCompared}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Detailed Breakdown:
                    </span>
                    <div className="font-medium">
                      {comparisonParameters?.includeDetailedBreakdown
                        ? "Yes"
                        : "No"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Yearly Comparison Section */}
        {yearlyComparison && yearlyComparison.length > 0 && (
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection("yearly")}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Yearly Breakdown</span>
              </div>
              {expandedSections.yearly ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {expandedSections.yearly && (
              <div className="p-3 border-t bg-gray-50/50 space-y-3">
                {yearlyComparison.map((yearData) => (
                  <div
                    key={yearData.year}
                    className="bg-white p-3 rounded border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">Year {yearData.year}</h5>
                      <div className="flex items-center gap-2">
                        {getDiscrepancyIcon(
                          yearData.discrepancy.netSequestration,
                        )}
                        <span
                          className={`text-xs px-2 py-1 rounded ${getDiscrepancyColor(yearData.discrepancy.netSequestration)}`}
                        >
                          {yearData.discrepancy.netSequestration.percentage.toFixed(
                            1,
                          )}
                          % diff
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Carbon Stock vs LCAM */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          Net Sequestration Comparison
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-xs text-muted-foreground">
                              Carbon Sensing
                            </div>
                            <div className="font-semibold text-blue-700">
                              {yearData.carbonStock.netSequestration.toLocaleString()}{" "}
                              ton CO2e
                            </div>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <div className="text-xs text-muted-foreground">
                              LCAM
                            </div>
                            <div className="font-semibold text-green-700">
                              {yearData.lcam.pengurangan_emisi_grk.toLocaleString()}{" "}
                              ton CO2e
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recommended Values */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">
                          Recommended Values
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <div className="bg-orange-50 p-2 rounded text-center">
                            <div className="text-muted-foreground">
                              Conservative
                            </div>
                            <div className="font-semibold text-orange-700">
                              {yearData.recommendedValues.netSequestrationTonCO2e.conservative.toFixed(
                                0,
                              )}
                            </div>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded text-center">
                            <div className="text-muted-foreground">
                              Moderate
                            </div>
                            <div className="font-semibold text-yellow-700">
                              {yearData.recommendedValues.netSequestrationTonCO2e.moderate.toFixed(
                                0,
                              )}
                            </div>
                          </div>
                          <div className="bg-emerald-50 p-2 rounded text-center">
                            <div className="text-muted-foreground">
                              Optimistic
                            </div>
                            <div className="font-semibold text-emerald-700">
                              {yearData.recommendedValues.netSequestrationTonCO2e.optimistic.toFixed(
                                0,
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quality Assessment Section */}
        <div className="border rounded-lg">
          <button
            onClick={() => toggleSection("quality")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium">Quality Assessment</span>
            </div>
            {expandedSections.quality ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {expandedSections.quality && (
            <div className="p-3 border-t bg-gray-50/50">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Data Reliability
                  </div>
                  <div
                    className={`px-3 py-2 rounded font-medium ${getReliabilityColor(qualityAssessment.dataReliability)}`}
                  >
                    {qualityAssessment.dataReliability}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Method Agreement
                  </div>
                  <div
                    className={`px-3 py-2 rounded font-medium ${getMethodAgreementColor(qualityAssessment.methodAgreement)}`}
                  >
                    {qualityAssessment.methodAgreement}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Confidence Level
                  </div>
                  <div
                    className={`px-3 py-2 rounded font-medium ${getReliabilityColor(qualityAssessment.confidenceLevel)}`}
                  >
                    {qualityAssessment.confidenceLevel}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Correlation
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {getCorrelationIcon(
                      summaryStatistics.correlationAnalysis
                        .netSequestrationCorrelation,
                    )}
                    <span className="text-sm capitalize">
                      {summaryStatistics.correlationAnalysis.netSequestrationCorrelation.replace(
                        "_",
                        " ",
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recommendations Section */}
        {recommendations && (
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection("recommendations")}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-500" />
                <span className="font-medium">Recommendations</span>
              </div>
              {expandedSections.recommendations ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {expandedSections.recommendations && (
              <div className="p-3 border-t bg-gray-50/50 space-y-4">
                {/* Recommended Values */}
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <h6 className="font-medium text-indigo-800 mb-3">
                    Recommended Net Sequestration Values
                  </h6>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        Optimistic
                      </div>
                      <div className="text-lg font-bold text-emerald-600">
                        {recommendations.netSequestrationValues.optimistic.toLocaleString()}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          ton CO2e
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marketable Credits Values */}
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <h6 className="font-medium text-emerald-800 mb-3">
                    Recommended Marketable Credits Values
                  </h6>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        Conservative
                      </div>
                      <div className="text-lg font-bold text-orange-600">
                        Rp.{" "}
                        {recommendations.marketableCreditsValues.conservative.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        Moderate
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        Rp.{" "}
                        {recommendations.marketableCreditsValues.moderate.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        Optimistic
                      </div>
                      <div className="text-lg font-bold text-emerald-600">
                        Rp.{" "}
                        {recommendations.marketableCreditsValues.optimistic.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferred Method */}
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h6 className="font-medium text-purple-800 mb-2">
                    Preferred Approach
                  </h6>
                  <div className="bg-white p-2 rounded border">
                    <div className="font-medium capitalize">
                      {recommendations.preferredMethod.replace(/_/g, " ")}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Based on {recommendations.methodAgreement} method
                      agreement between carbon sensing and LCAM
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h6 className="font-medium text-yellow-800 mb-3">
                    Risk Assessment
                  </h6>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="bg-white p-2 rounded border flex items-center gap-2">
                      {recommendations.riskAssessment.overestimationRisk ===
                      "high" ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Overestimation Risk
                        </div>
                        <div
                          className={`font-medium ${recommendations.riskAssessment.overestimationRisk === "high" ? "text-red-600" : "text-green-600"}`}
                        >
                          {recommendations.riskAssessment.overestimationRisk}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border flex items-center gap-2">
                      {recommendations.riskAssessment.underestimationRisk ===
                      "high" ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Underestimation Risk
                        </div>
                        <div
                          className={`font-medium ${recommendations.riskAssessment.underestimationRisk === "high" ? "text-red-600" : "text-green-600"}`}
                        >
                          {recommendations.riskAssessment.underestimationRisk}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded border flex items-center gap-2">
                      {recommendations.riskAssessment.dataQualityRisk ===
                      "high" ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Data Quality Risk
                        </div>
                        <div
                          className={`font-medium ${recommendations.riskAssessment.dataQualityRisk === "high" ? "text-red-600" : "text-green-600"}`}
                        >
                          {recommendations.riskAssessment.dataQualityRisk}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="pt-3 border-t text-xs text-muted-foreground flex justify-between">
          <span>
            Comparison completed •{" "}
            {metadata?.comparisonDate &&
              new Date(metadata.comparisonDate).toLocaleDateString()}
          </span>
          <span>{part.id}</span>
        </div>
      </div>
    </Card>
  );
};
