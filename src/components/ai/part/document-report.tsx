// FINAL FIXED: Carbon Stock Report UI Component
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/classnames";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Flag,
  Loader2,
  PieChart,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { FC } from "react";
import type { ToolPart } from ".";

// FIXED 1: LULCTable Component dengan logic yang diperbaiki
const LULCTable: FC<{ landUseChangeData: any }> = ({ landUseChangeData }) => {
  console.log("LULCTable received data:", landUseChangeData);

  if (!landUseChangeData?.tableData?.length) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        No LULC data available
      </div>
    );
  }

  const { tableData, availableYears } = landUseChangeData;

  // FIXED: Lebih permissive filter - tampilkan semua data yang punya perubahan atau pixel > 0
  const filteredData = tableData.filter((row: any) => {
    // Check if any year has pixels > 0 OR if there's any change
    const hasPixels = availableYears?.some((year: string) => {
      const pixels = parseInt(
        row[year]?.match(/\((\d+(?:,\d+)*) px\)/)?.[1]?.replace(/,/g, "") ||
          "0",
      );
      return pixels > 0;
    });

    // Also show if there's any change percentage
    const hasChange = row.changePercent && row.changePercent !== "0.0%";

    return hasPixels || hasChange;
  });

  console.log("Filtered data count:", tableData.length);
  console.log("Available years:", availableYears);

  return (
    <div className="mt-4">
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <tr>
              <th className="p-2 text-left min-w-[50px]">Class</th>
              <th className="p-2 text-left min-w-[120px]">Name</th>
              {/* FIXED: Show first 4 years instead of 3 */}
              {availableYears?.map((year: string) => (
                <th key={year} className="p-2 text-center min-w-[80px]">
                  {year.replace("baseline", "Base ").replace("year", "")}
                </th>
              ))}
              <th className="p-2 text-center min-w-[70px]">Change %</th>
              <th className="p-2 text-center min-w-[80px]">Trend</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row: any, index: number) => (
              <tr
                key={`${row.lulcClass}-${index}`}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="p-2 font-medium text-center">{row.lulcClass}</td>
                <td className="p-2 text-gray-700 font-medium">
                  {row.className}
                </td>
                {/* FIXED: Show area data for first 4 years */}
                {availableYears?.map((year: string) => (
                  <td key={year} className="p-2 text-center text-xs font-mono">
                    {year == "2019"
                      ? row[`baseline${year}`]
                      : row[`year${year}`]}
                  </td>
                ))}
                <td
                  className={`p-2 text-center font-bold ${
                    row.changePercent?.includes("+")
                      ? "text-green-600 bg-green-50"
                      : row.changePercent?.includes("-")
                        ? "text-red-600 bg-red-50"
                        : "text-gray-600"
                  }`}
                >
                  {row.changePercent || "0%"}
                </td>
                <td className="p-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      row.trend?.includes("Increase")
                        ? "bg-green-100 text-green-700"
                        : row.trend?.includes("Decrease")
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {row.trend === "Significant Increase"
                      ? "Inc++"
                      : row.trend === "Significant Decrease"
                        ? "Dec--"
                        : row.trend === "Moderate Increase"
                          ? "Inc+"
                          : row.trend === "Moderate Decrease"
                            ? "Dec-"
                            : "Stable"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FIXED: Show data summary */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs font-medium text-blue-800 mb-1">
            Data Summary
          </div>
          <div className="text-xs text-blue-700">
            Total Classes: {tableData.length} | Active: {filteredData.length} |
            Years: {availableYears?.length || 0}
          </div>
        </div>

        {landUseChangeData.summary && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs font-medium text-green-800 mb-1">
              Analysis Period
            </div>
            <div className="text-xs text-green-700 line-clamp-2">
              {landUseChangeData.summary.substring(0, 100)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// FIXED 2: Complete HTML generation function
function generateLULCTableHTML(landUseChangeData: any): string {
  if (!landUseChangeData?.tableData?.length) {
    return '<p style="color: #666; padding: 10px; background: #f5f5f5; border-radius: 5px;">No LULC data available</p>';
  }

  const { tableData, availableYears } = landUseChangeData;

  // Filter data that has pixels > 0 or change percentage
  const filteredData = tableData.filter((row: any) => {
    const hasPixels = availableYears?.some((year: string) => {
      const pixels = parseInt(
        row[year]?.match(/\((\d+(?:,\d+)*) px\)/)?.[1]?.replace(/,/g, "") ||
          "0",
      );
      return pixels > 0;
    });
    const hasChange = row.changePercent && row.changePercent !== "0.0%";
    return hasPixels || hasChange;
  });

  let tableHTML = `
    <div style="margin: 20px 0;">
      
      <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: linear-gradient(90deg, #059669, #2563eb); color: black;">
              <th style="padding: 8px; text-align: left; min-width: 50px;">Class</th>
              <th style="padding: 8px; text-align: left; min-width: 120px;">Name</th>`;

  // Add year columns
  availableYears?.forEach((year: string) => {
    tableHTML += `<th style="padding: 8px; text-align: center; min-width: 80px;">${year.replace("baseline", "Base ").replace("year", "")}</th>`;
  });

  tableHTML += `
              <th style="padding: 8px; text-align: center; min-width: 70px;">Change %</th>
              <th style="padding: 8px; text-align: center; min-width: 80px;">Trend</th>
            </tr>
          </thead>
          <tbody>`;

  // Add data rows
  tableData.forEach((row: any, index: number) => {
    const bgColor = index % 2 === 0 ? "#f9fafb" : "white";
    tableHTML += `
      <tr style="background-color: ${bgColor};">
        <td style="padding: 8px; font-weight: bold; text-align: center;">${row.lulcClass}</td>
        <td style="padding: 8px; color: #374151; font-weight: 500;">${row.className}</td>`;

    // Add year data
    availableYears?.forEach((year: string) => {
      const yearData =
        year === "2019" ? row[`baseline${year}`] : row[`year${year}`];
      tableHTML += `<td style="padding: 8px; text-align: center; font-family: monospace;">${yearData || "-"}</td>`;
    });

    // Add change percentage with color
    let changeStyle = "padding: 8px; text-align: center; font-weight: bold;";
    if (row.changePercent?.includes("+")) {
      changeStyle += " color: #059669; background-color: #ecfdf5;";
    } else if (row.changePercent?.includes("-")) {
      changeStyle += " color: #dc2626; background-color: #fef2f2;";
    } else {
      changeStyle += " color: #6b7280;";
    }

    tableHTML += `<td style="${changeStyle}">${row.changePercent || "0%"}</td>`;

    // Add trend with styling
    let trendText = "Stable";
    let trendStyle =
      "padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;";

    if (row.trend?.includes("Increase")) {
      trendText = row.trend === "Significant Increase" ? "Inc++" : "Inc+";
      trendStyle += " background-color: #dcfce7; color: #166534;";
    } else if (row.trend?.includes("Decrease")) {
      trendText = row.trend === "Significant Decrease" ? "Dec--" : "Dec-";
      trendStyle += " background-color: #fee2e2; color: #991b1b;";
    } else {
      trendStyle += " background-color: #f3f4f6; color: #374151;";
    }

    tableHTML += `
        <td style="padding: 8px; text-align: center;">
          <span style="${trendStyle}">${trendText}</span>
        </td>
      </tr>`;
  });

  tableHTML += `
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div style="padding: 12px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
          <div style="font-size: 11px; font-weight: 500; color: #1e40af; margin-bottom: 4px;">Data Summary</div>
          <div style="font-size: 11px; color: #1d4ed8;">
            Total Classes: ${tableData.length} | Active: ${filteredData.length} | Years: ${availableYears?.length || 0}
          </div>
        </div>`;

  if (landUseChangeData.summary) {
    tableHTML += `
        <div style="padding: 12px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
          <div style="font-size: 11px; font-weight: 500; color: #166534; margin-bottom: 4px;">Analysis Period</div>
          <div style="font-size: 11px; color: #15803d;">
            ${landUseChangeData.summary.substring(0, 100)}...
          </div>
        </div>`;
  }

  tableHTML += `
      </div>
    </div>`;

  return tableHTML;
}

// Carbon Pool Table Component
const CarbonPoolTable: FC<{ carbonPoolData: any }> = ({ carbonPoolData }) => {
  console.log("CarbonPoolTable received data:", carbonPoolData);

  if (!carbonPoolData?.tableData?.length) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        No Carbon Pool data available
      </div>
    );
  }

  const { tableData, totals, availableYears } = carbonPoolData;

  return (
    <div className="mt-4">
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
            <tr>
              <th className="p-2 text-left min-w-[60px]">Year</th>
              <th className="p-2 text-center min-w-[100px]">Carbon Stocks</th>
              <th className="p-2 text-center min-w-[100px]">Forest Growth</th>
              <th className="p-2 text-center min-w-[100px]">
                Net Sequestration
              </th>
              <th className="p-2 text-center min-w-[80px]">Leakage</th>
              <th className="p-2 text-center min-w-[80px]">Change</th>
              <th className="p-2 text-center min-w-[70px]">Rate %</th>
              <th className="p-2 text-center min-w-[80px]">Trend</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row: any, index: number) => (
              <tr
                key={`carbon-${row.year}-${index}`}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="p-2 font-medium text-center">{row.year}</td>
                <td className="p-2 text-center text-xs font-mono">
                  {row.carbonStocks}
                </td>
                <td className="p-2 text-center text-xs font-mono">
                  {row.forestGrowth}
                </td>
                <td className="p-2 text-center text-xs font-mono">
                  {row.netSequestration}
                </td>
                <td className="p-2 text-center text-xs font-mono">
                  {row.leakage}
                </td>
                <td
                  className={`p-2 text-center font-bold ${
                    row.carbonStockChange?.includes("+")
                      ? "text-green-600 bg-green-50"
                      : row.carbonStockChange?.includes("-")
                        ? "text-red-600 bg-red-50"
                        : "text-gray-600"
                  }`}
                >
                  {row.carbonStockChange || "0 Mg C"}
                </td>
                <td
                  className={`p-2 text-center font-bold ${
                    parseFloat(row.sequestrationRate) > 2
                      ? "text-green-600 bg-green-50"
                      : parseFloat(row.sequestrationRate) < -2
                        ? "text-red-600 bg-red-50"
                        : "text-gray-600"
                  }`}
                >
                  {row.sequestrationRate || "0%"}
                </td>
                <td className="p-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      row.trend?.includes("High")
                        ? "bg-green-100 text-green-700"
                        : row.trend?.includes("Loss")
                          ? "bg-red-100 text-red-700"
                          : row.trend?.includes("Moderate")
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {row.trend === "High Sequestration"
                      ? "High Seq"
                      : row.trend === "Carbon Loss"
                        ? "Loss"
                        : row.trend === "Moderate Sequestration"
                          ? "Mod Seq"
                          : row.trend === "Low Performance"
                            ? "Low Perf"
                            : "Stable"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs font-medium text-blue-800 mb-1">
            Carbon Totals
          </div>
          <div className="text-xs text-blue-700">
            Total Stocks: {totals.totalCarbonStocks.toLocaleString()} Mg C | Avg
            Rate: {totals.averageSequestrationRate.toFixed(2)} Mg C/year
          </div>
        </div>

        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-xs font-medium text-green-800 mb-1">
            Performance Summary
          </div>
          <div className="text-xs text-green-700">
            Net Sequestration: {totals.totalNetSequestration.toLocaleString()}{" "}
            Mg C | Leakage: {totals.totalLeakage.toLocaleString()} Mg C
          </div>
        </div>
      </div>
    </div>
  );
};

// Comparison Table Component
const ComparisonTable: FC<{ comparisonData: any }> = ({ comparisonData }) => {
  console.log("ComparisonTable received data:", comparisonData);

  if (!comparisonData?.tableData?.length) {
    return (
      <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
        No Comparison data available
      </div>
    );
  }

  const { tableData, overallMetrics, availableYears } = comparisonData;

  return (
    <div className="mt-4">
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
            <tr>
              <th className="p-2 text-left min-w-[50px]">Year</th>
              <th className="p-2 text-center min-w-[100px]">LCAM Emission</th>
              <th className="p-2 text-center min-w-[100px]">
                AI Sequestration
              </th>
              <th className="p-2 text-center min-w-[100px]">LCAM C-Stock</th>
              <th className="p-2 text-center min-w-[100px]">AI C-Stock</th>
              <th className="p-2 text-center min-w-[90px]">Abs. Discrepancy</th>
              <th className="p-2 text-center min-w-[70px]">% Discrepancy</th>
              <th className="p-2 text-center min-w-[80px]">Type</th>
              <th className="p-2 text-center min-w-[80px]">Agreement</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row: any, index: number) => (
              <tr
                key={`comparison-${row.year}-${index}`}
                className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="p-2 font-medium text-center">{row.year}</td>
                <td className="p-2 text-center text-xs font-mono">
                  {row.lcamEmissionReduction}
                </td>
                <td className="p-2 text-center text-xs font-mono">
                  {row.carbonSensingNetSequestration}
                </td>
                <td className="p-2 text-center text-xs font-mono">
                  {row.lcamCarbonStock}
                </td>
                <td className="p-2 text-center text-xs font-mono">
                  {row.carbonSensingCarbonStock}
                </td>
                <td className="p-2 text-center text-xs font-mono text-gray-700">
                  {row.absoluteDiscrepancy}
                </td>
                <td
                  className={`p-2 text-center font-bold ${
                    Math.abs(parseFloat(row.percentageDiscrepancy)) > 25
                      ? "text-red-600 bg-red-50"
                      : Math.abs(parseFloat(row.percentageDiscrepancy)) > 10
                        ? "text-yellow-600 bg-yellow-50"
                        : "text-green-600 bg-green-50"
                  }`}
                >
                  {row.percentageDiscrepancy}
                </td>
                <td className="p-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      row.discrepancyType?.includes("LCAM Higher")
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {row.discrepancyType === "LCAM Higher" ? "LCAM↑" : "AI↑"}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      row.agreement === "Excellent"
                        ? "bg-green-100 text-green-700"
                        : row.agreement === "Good"
                          ? "bg-blue-100 text-blue-700"
                          : row.agreement === "Fair"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                    }`}
                  >
                    {row.agreement}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-xs font-medium text-orange-800 mb-1">
            Total Comparison
          </div>
          <div className="text-xs text-orange-700">
            LCAM: {overallMetrics.totalLCAMReduction.toLocaleString()} | AI:{" "}
            {overallMetrics.totalCarbonSensingSequestration.toLocaleString()}{" "}
            ton CO2e
          </div>
        </div>

        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="text-xs font-medium text-red-800 mb-1">
            Quality Assessment
          </div>
          <div className="text-xs text-red-700">
            Avg Discrepancy: {overallMetrics.averageDiscrepancy.toFixed(1)}% |
            Agreement: {overallMetrics.methodAgreement}
          </div>
        </div>
      </div>
    </div>
  );
};

// HTML Generation Functions
function generateCarbonPoolTableHTML(carbonPoolData: any): string {
  if (!carbonPoolData?.tableData?.length) {
    return '<p style="color: #666; padding: 10px; background: #f5f5f5; border-radius: 5px;">No Carbon Pool data available</p>';
  }

  const { tableData, totals } = carbonPoolData;

  let tableHTML = `
    <div style="margin: 20px 0;">
      
      <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: linear-gradient(90deg, #2563eb, #059669); color: black;">
              <th style="padding: 8px; text-align: center;">Year</th>
              <th style="padding: 8px; text-align: center;">Carbon Stocks</th>
              <th style="padding: 8px; text-align: center;">Forest Growth</th>
              <th style="padding: 8px; text-align: center;">Net Sequestration</th>
              <th style="padding: 8px; text-align: center;">Leakage</th>
              <th style="padding: 8px; text-align: center;">Change</th>
              <th style="padding: 8px; text-align: center;">Rate %</th>
              <th style="padding: 8px; text-align: center;">Trend</th>
            </tr>
          </thead>
          <tbody>`;

  tableData.forEach((row: any, index: number) => {
    const bgColor = index % 2 === 0 ? "#f9fafb" : "white";
    tableHTML += `
      <tr style="background-color: ${bgColor};">
        <td style="padding: 8px; text-align: center; font-weight: bold;">${row.year}</td>
        <td style="padding: 8px; text-align: center; font-family: monospace;">${row.carbonStocks}</td>
        <td style="padding: 8px; text-align: center; font-family: monospace;">${row.forestGrowth}</td>
        <td style="padding: 8px; text-align: center; font-family: monospace;">${row.netSequestration}</td>
        <td style="padding: 8px; text-align: center; font-family: monospace;">${row.leakage}</td>
        <td style="padding: 8px; text-align: center; font-weight: bold; color: ${
          row.carbonStockChange?.includes("+")
            ? "#059669"
            : row.carbonStockChange?.includes("-")
              ? "#dc2626"
              : "#6b7280"
        };">${row.carbonStockChange}</td>
        <td style="padding: 8px; text-align: center; font-weight: bold; color: ${
          parseFloat(row.sequestrationRate) > 2
            ? "#059669"
            : parseFloat(row.sequestrationRate) < -2
              ? "#dc2626"
              : "#6b7280"
        };">${row.sequestrationRate}</td>
        <td style="padding: 8px; text-align: center;">
          <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; 
            background-color: ${
              row.trend?.includes("High")
                ? "#dcfce7"
                : row.trend?.includes("Loss")
                  ? "#fee2e2"
                  : row.trend?.includes("Moderate")
                    ? "#dbeafe"
                    : "#f3f4f6"
            }; 
            color: ${
              row.trend?.includes("High")
                ? "#166534"
                : row.trend?.includes("Loss")
                  ? "#991b1b"
                  : row.trend?.includes("Moderate")
                    ? "#1e40af"
                    : "#374151"
            };">
            ${
              row.trend === "High Sequestration"
                ? "High Seq"
                : row.trend === "Carbon Loss"
                  ? "Loss"
                  : row.trend === "Moderate Sequestration"
                    ? "Mod Seq"
                    : row.trend === "Low Performance"
                      ? "Low Perf"
                      : "Stable"
            }
          </span>
        </td>
      </tr>`;
  });

  tableHTML += `
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div style="padding: 12px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
          <div style="font-size: 11px; font-weight: 500; color: #1e40af; margin-bottom: 4px;">Carbon Totals</div>
          <div style="font-size: 11px; color: #1d4ed8;">
            Total Stocks: ${totals.totalCarbonStocks.toLocaleString()} Mg C | Avg Rate: ${totals.averageSequestrationRate.toFixed(2)} Mg C/year
          </div>
        </div>
        <div style="padding: 12px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
          <div style="font-size: 11px; font-weight: 500; color: #166534; margin-bottom: 4px;">Performance Summary</div>
          <div style="font-size: 11px; color: #15803d;">
            Net Sequestration: ${totals.totalNetSequestration.toLocaleString()} Mg C | Leakage: ${totals.totalLeakage.toLocaleString()} Mg C
          </div>
        </div>
      </div>
    </div>`;

  return tableHTML;
}

function generateCarbonPricingTableHTML(comparisonData: any): string {
  if (!comparisonData?.tableData?.length) {
    return '<p style="color: #666; padding: 10px; background: #f5f5f5; border-radius: 5px;">No Carbon Credit data available</p>';
  }

  const { tableData, overallMetrics } = comparisonData;

  // Helper function to safely parse numeric values from strings
  function safeParseFloat(value: any): number {
    if (value === null || value === undefined) return 0;

    // Convert to string and clean it
    const cleanValue = String(value)
      .replace(/[^0-9.-]/g, "") // Remove everything except numbers, dots, and minus
      .replace(/,/g, ""); // Remove commas

    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Helper function to format numbers for display
  function formatNumber(num: number): string {
    if (num === 0) return "0";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  let tableHTML = `
    <div style="margin: 20px 0;">
      
      <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: linear-gradient(90deg, #2563eb, #059669); color: black;">
              <th style="padding: 8px; text-align: center;">Year</th>
              <th style="padding: 8px; text-align: center;">CarbonSensingAI (Min Credits)</th>
              <th style="padding: 8px; text-align: center;">LCAM Claimed (Min Credits)</th>
              <th style="padding: 8px; text-align: center;">Discrepancy (Min Credits)</th>
              <th style="padding: 8px; text-align: center;">CarbonSensingAI (Max Credits)</th>
              <th style="padding: 8px; text-align: center;">LCAM Claimed (Max Credits)</th>
              <th style="padding: 8px; text-align: center;">Discrepancy (Max Credits)</th>
            </tr>
          </thead>
          <tbody>`;

  tableData.forEach((row: any, index: number) => {
    const bgColor = index % 2 === 0 ? "#f9fafb" : "white";

    // Safely parse the values
    const lcamValue = safeParseFloat(row.lcamEmissionReduction);
    const carbonSensingValue = safeParseFloat(
      row.carbonSensingNetSequestration,
    );

    // Calculate credits (Min: 30000, Max: 70000 multiplier)
    const lcamMinCredits = lcamValue * 30000;
    const carbonSensingMinCredits = carbonSensingValue * 30000;
    const discrepancyMin = lcamMinCredits - carbonSensingMinCredits;

    const lcamMaxCredits = lcamValue * 70000;
    const carbonSensingMaxCredits = carbonSensingValue * 70000;
    const discrepancyMax = lcamMaxCredits - carbonSensingMaxCredits;

    tableHTML += `
      <tr style="background-color: ${bgColor};">
        <td style="padding: 8px; text-align: center; font-weight: bold;">${row.year ?? "N/A"}</td>
        <td style="padding: 8px; text-align: center; font-family: monospace;">${carbonSensingMinCredits > 0 ? formatNumber(carbonSensingMinCredits) : 0} IDR</td>
        <td style="padding: 8px; text-align: center; font-family: monospace;">${lcamMinCredits > 0 ? formatNumber(lcamMinCredits) : 0} IDR</td>
        <td style="padding: 8px; text-align: center; font-family: monospace; color: ${discrepancyMin >= 0 ? "#dc2626" : "#059669"};">${formatNumber(discrepancyMin)}</td>
        <td style="padding: 8px; text-align: center; font-family: monospace;">${carbonSensingMaxCredits > 0 ? formatNumber(carbonSensingMaxCredits) : 0} IDR</td>
        <td style="padding: 8px; text-align: center; font-family: monospace;">${lcamMaxCredits > 0 ? formatNumber(lcamMaxCredits) : 0} IDR</td>
        <td style="padding: 8px; text-align: center; font-family: monospace; color: ${discrepancyMax >= 0 ? "#dc2626" : "#059669"};">${formatNumber(discrepancyMax)}</td>
      </tr>`;
  });

  tableHTML += `
          </tbody>
        </table>
      </div>
    </div>`;

  return tableHTML;
}

function generateComparisonTableHTML(comparisonData: any): string {
  if (!comparisonData?.tableData?.length) {
    return '<p style="color: #666; padding: 10px; background: #f5f5f5; border-radius: 5px;">No Comparison data available</p>';
  }

  const { tableData, overallMetrics } = comparisonData;

  let tableHTML = `
    <div style="margin: 20px 0;">
      
      <div style="overflow-x: auto; border: 1px solid #ddd; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: linear-gradient(90deg, #ea580c, #dc2626); color: black;">
              <th style="padding: 8px; text-align: center;">Year</th>
              <th style="padding: 8px; text-align: center;">LCAM Claimed Emission</th>
              <th style="padding: 8px; text-align: center;">CarbonSensingAI Sequestration</th>
              <th style="padding: 8px; text-align: center;">Abs. Discrepancy</th>
              <th style="padding: 8px; text-align: center;">% Discrepancy</th>
              <th style="padding: 8px; text-align: center;">Type</th>
              <th style="padding: 8px; text-align: center;">Agreement</th>
            </tr>
          </thead>
          <tbody>`;

  tableData.forEach((row: any, index: number) => {
    const bgColor = index % 2 === 0 ? "#f9fafb" : "white";
    tableHTML += `
      <tr style="background-color: ${bgColor};">
        <td style="padding: 8px; text-align: center; font-weight: bold;">${row.year}</td>
        <td style="padding: 8px; text-align: center; font-family: monospace;">${row.lcamEmissionReduction}</td>
        <td style="padding: 8px; text-align: center; font-family: monospace;">${row.carbonSensingNetSequestration}</td>
        <td style="padding: 8px; text-align: center; font-family: monospace; color: #374151;">${row.absoluteDiscrepancy}</td>
        <td style="padding: 8px; text-align: center; font-weight: bold; color: ${
          Math.abs(parseFloat(row.percentageDiscrepancy)) > 25
            ? "#dc2626"
            : Math.abs(parseFloat(row.percentageDiscrepancy)) > 10
              ? "#d97706"
              : "#059669"
        }; background-color: ${
          Math.abs(parseFloat(row.percentageDiscrepancy)) > 25
            ? "#fef2f2"
            : Math.abs(parseFloat(row.percentageDiscrepancy)) > 10
              ? "#fef3c7"
              : "#f0fdf4"
        };">${row.percentageDiscrepancy}</td>
        <td style="padding: 8px; text-align: center;">
          <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; 
            background-color: ${row.discrepancyType?.includes("LCAM Higher") ? "#dbeafe" : "#e9d5ff"}; 
            color: ${row.discrepancyType?.includes("LCAM Higher") ? "#1e40af" : "#7c3aed"};">
            ${row.discrepancyType === "LCAM Higher" ? "LCAM↑" : "AI↑"}
          </span>
        </td>
        <td style="padding: 8px; text-align: center;">
          <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; 
            background-color: ${
              row.agreement === "Excellent"
                ? "#dcfce7"
                : row.agreement === "Good"
                  ? "#dbeafe"
                  : row.agreement === "Fair"
                    ? "#fef3c7"
                    : "#fee2e2"
            }; 
            color: ${
              row.agreement === "Excellent"
                ? "#166534"
                : row.agreement === "Good"
                  ? "#1e40af"
                  : row.agreement === "Fair"
                    ? "#92400e"
                    : "#991b1b"
            };">
            ${row.agreement}
          </span>
        </td>
      </tr>`;
  });

  tableHTML += `
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div style="padding: 12px; background-color: #fff7ed; border-radius: 8px; border: 1px solid #fed7aa;">
          <div style="font-size: 11px; font-weight: 500; color: #9a3412; margin-bottom: 4px;">Total Comparison</div>
          <div style="font-size: 11px; color: #c2410c;">
            LCAM: ${overallMetrics.totalLCAMReduction.toLocaleString()} | AI: ${overallMetrics.totalCarbonSensingSequestration.toLocaleString()} ton CO2e
          </div>
        </div>
        <div style="padding: 12px; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
          <div style="font-size: 11px; font-weight: 500; color: #991b1b; margin-bottom: 4px;">Quality Assessment</div>
          <div style="font-size: 11px; color: #dc2626;">
            Avg Discrepancy: ${overallMetrics.averageDiscrepancy.toFixed(1)}% | Agreement: ${overallMetrics.methodAgreement}
          </div>
        </div>
      </div>
    </div>`;

  return tableHTML;
}
function removeBoldMarkdown(text: string) {
  if (!text || typeof text !== "string") return text;
  return text.replace(/\*\*(.*?)\*\*/g, "$1");
}

// PERUBAHAN 3: Update function getOverallPriority (GANTI yang lama)
function getOverallPriority(
  riskLevel: string | undefined,
  redFlagRiskLevel: string | undefined,
): {
  level: string;
  color: string;
  icon: any;
  description: string;
  timeline: string;
} {
  // Determine overall risk based on both technical and red flag risk
  const overallRisk = [riskLevel, redFlagRiskLevel].includes("CRITICAL")
    ? "CRITICAL"
    : [riskLevel, redFlagRiskLevel].includes("HIGH")
      ? "HIGH"
      : [riskLevel, redFlagRiskLevel].includes("MEDIUM")
        ? "MEDIUM"
        : "LOW";

  switch (overallRisk) {
    case "CRITICAL":
      return {
        level: "CRITICAL RISK",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: AlertTriangle,
        description:
          "Immediate freeze and investigation required - Multiple red flags detected",
        timeline: "🚨 24 Hours",
      };
    case "HIGH":
      return {
        level: "HIGH RISK",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: AlertCircle,
        description:
          "Priority investigation required - Significant anomalies and red flags detected",
        timeline: "⚠️ 72 Hours",
      };
    case "MEDIUM":
      return {
        level: "MEDIUM RISK",
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: AlertCircle,
        description:
          "Enhanced monitoring required - Some red flags and discrepancies found",
        timeline: "📅 1 Week",
      };
    default:
      return {
        level: "LOW RISK",
        color: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle,
        description: "Standard monitoring - Minimal concerns detected",
        timeline: "📅 1 Month",
      };
  }
}
// PERUBAHAN HTML GENERATION: Tambahkan function untuk Red Flag Analysis HTML
function generateRedFlagAnalysisHTML(redFlagAnalysis: any): string {
  if (!redFlagAnalysis || !Object.values(redFlagAnalysis).some(Boolean)) {
    return '<p style="color: #666; padding: 10px; background: #f5f5f5; border-radius: 5px;">No red flag analysis available</p>';
  }

  let redFlagHTML = `
    <div style="margin: 20px 0;">
      <h4 style="color: #dc2626; margin-bottom: 15px; font-size: 16px; font-weight: bold;">
        🚩 RED FLAG ANALYSIS SUMMARY
      </h4>`;

  // Environmental Red Flags
  if (
    redFlagAnalysis.environmentalRedFlag1 ||
    redFlagAnalysis.environmentalRedFlag2
  ) {
    redFlagHTML += `
      <div style="margin-bottom: 20px; padding: 15px; background: #f0fdf4; border-left: 4px solid #059669; border-radius: 5px;">
        <h5 style="color: #059669; margin-bottom: 10px; font-size: 14px; font-weight: bold;">🌿 ENVIRONMENTAL RED FLAGS</h5>`;

    if (redFlagAnalysis.environmentalRedFlag1) {
      redFlagHTML += `
        <div style="margin-bottom: 10px;">
          <strong>Carbon Activity Analysis (${redFlagAnalysis.environmentalRedFlag1.severity || "Medium"}):</strong>
          <div style="margin-top: 5px; font-size: 12px;">
            ${redFlagAnalysis.environmentalRedFlag1.keyFindings?.slice(0, 3).join("<br>") || "Analysis completed"}
          </div>
        </div>`;
    }

    if (redFlagAnalysis.environmentalRedFlag2) {
      redFlagHTML += `
        <div style="margin-bottom: 10px;">
          <strong>Land Disputes Analysis (${redFlagAnalysis.environmentalRedFlag2.severity || "Medium"}):</strong>
          <div style="margin-top: 5px; font-size: 12px;">
            Overlap Area: ${redFlagAnalysis.environmentalRedFlag2.spatialAnalysis?.overlapArea || 0} ha<br>
            Land Issues: ${redFlagAnalysis.environmentalRedFlag2.landIssues?.length || 0} identified
          </div>
        </div>`;
    }

    redFlagHTML += `</div>`;
  }

  // Financial Red Flags
  if (redFlagAnalysis.financialRedFlag1 || redFlagAnalysis.financialRedFlag2) {
    redFlagHTML += `
      <div style="margin-bottom: 20px; padding: 15px; background: #fef3c7; border-left: 4px solid #d97706; border-radius: 5px;">
        <h5 style="color: #d97706; margin-bottom: 10px; font-size: 14px; font-weight: bold;">💰 FINANCIAL RED FLAGS</h5>`;

    if (redFlagAnalysis.financialRedFlag1) {
      redFlagHTML += `
        <div style="margin-bottom: 10px;">
          <strong>PEPs Analysis (${redFlagAnalysis.financialRedFlag1.pepsSeverity || "Medium"}):</strong>
          <div style="margin-top: 5px; font-size: 12px;">
            Suspicious Personnel: ${redFlagAnalysis.financialRedFlag1.suspiciousPersonnel?.length || 0}<br>
            International Cooperation: ${redFlagAnalysis.financialRedFlag1.internationalCooperation ? "Required" : "Not Required"}
          </div>
        </div>`;
    }

    if (redFlagAnalysis.financialRedFlag2) {
      redFlagHTML += `
        <div style="margin-bottom: 10px;">
          <strong>Trading Patterns Analysis:</strong>
          <div style="margin-top: 5px; font-size: 12px;">
            Status: ${redFlagAnalysis.financialRedFlag2.developmentStatus || "Development"}<br>
            Red Flags to Monitor: ${redFlagAnalysis.financialRedFlag2.redFlagsToMonitor?.length || 0}
          </div>
        </div>`;
    }

    redFlagHTML += `</div>`;
  }

  // Integrated Findings
  if (redFlagAnalysis.integratedFindings) {
    redFlagHTML += `
      <div style="margin-bottom: 20px; padding: 15px; background: #fee2e2; border-left: 4px solid #dc2626; border-radius: 5px;">
        <h5 style="color: #dc2626; margin-bottom: 10px; font-size: 14px; font-weight: bold;">🔍 INTEGRATED CRITICAL FINDINGS</h5>
        <div style="font-size: 12px; line-height: 1.5;">
          <strong>Overall Risk Level:</strong> ${redFlagAnalysis.integratedFindings.overallRiskLevel || "Unknown"}<br>
          <strong>Cross-Cutting Issues:</strong> ${redFlagAnalysis.integratedFindings.crossCuttingIssues?.length || 0}<br>
          <div style="margin-top: 10px;">
            ${redFlagAnalysis.integratedFindings.executiveSummary?.substring(0, 300) || "Comprehensive analysis completed"}...
          </div>
        </div>
      </div>`;
  }

  // AI Anomaly Detection
  if (redFlagAnalysis.anomalyDetection) {
    redFlagHTML += `
      <div style="margin-bottom: 20px; padding: 15px; background: #e0e7ff; border-left: 4px solid #4f46e5; border-radius: 5px;">
        <h5 style="color: #4f46e5; margin-bottom: 10px; font-size: 14px; font-weight: bold;">🤖 AI ANOMALY DETECTION</h5>
        <div style="font-size: 12px;">
          <strong>Risk Level:</strong> ${redFlagAnalysis.anomalyDetection.riskLevel || "Unknown"}<br>
          <strong>Investigation Priority:</strong> ${redFlagAnalysis.anomalyDetection.investigationPriority || "Medium"}<br>
          <strong>Economic Impact:</strong> Rp ${redFlagAnalysis.anomalyDetection.economicImpact?.toLocaleString() || "0"}<br>
          <strong>Key Findings:</strong> ${redFlagAnalysis.anomalyDetection.keyFindings?.length || 0} identified
        </div>
      </div>`;
  }

  redFlagHTML += `</div>`;
  return redFlagHTML;
}

// PERUBAHAN UTAMA: GANTI generateHTMLReportWithStructuredData menjadi generateHTMLReportWithRedFlagIntegration
async function generateHTMLReportWithRedFlagIntegration(
  data: any,
): Promise<void> {
  try {
    // Generate existing table HTMLs (keep unchanged)
    const lulcTableHTML = data.content?.remote_sensing_land_use_change
      ? generateLULCTableHTML(data.content.remote_sensing_land_use_change)
      : '<p style="color: #666;">Data tidak tersedia</p>';

    const carbonPoolTableHTML = data.content?.remote_sensing_carbon_pool
      ? generateCarbonPoolTableHTML(data.content.remote_sensing_carbon_pool)
      : '<p style="color: #666;">Data tidak tersedia</p>';

    const comparisonTableHTML = data.content
      ?.compare_carbon_stock_lcam_remote_sensing
      ? generateComparisonTableHTML(
          data.content.compare_carbon_stock_lcam_remote_sensing,
        )
      : '<p style="color: #666;">Data tidak tersedia</p>';

    const carbonPricingTableHTML = data.content
      ?.compare_carbon_stock_lcam_remote_sensing
      ? generateCarbonPricingTableHTML(
          data.content.compare_carbon_stock_lcam_remote_sensing,
        )
      : '<p style="color: #666;">Data tidak tersedia</p>';

    // NEW: Generate Red Flag Analysis HTML
    const redFlagAnalysisHTML = generateRedFlagAnalysisHTML(
      data.redFlagAnalysis,
    );

    // ENHANCED: Critical findings with red flag integration
    const enhancedCriticalFindings =
      data.content?.critical_finding || "Data tidak tersedia";

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PPATK Carbon Stock Investigation Report - ${data.content?.judul_kegiatan || "Report"}</title>
    <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.6; 
          color: #333;
        }
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin: 20px 0; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left; 
        }
        th { 
          background-color: #f2f2f2; 
          font-weight: bold;
        }
        .header { 
          background: linear-gradient(135deg, #dc2626, #ea580c); 
          color: white; 
          padding: 30px; 
          text-align: center; 
          border-radius: 10px;
          margin-bottom: 30px;
        }
        .section { 
          margin: 30px 0; 
          padding: 20px; 
          border-left: 4px solid #2563eb; 
          background: #f8fafc;
        }
        .red-flag-section {
          margin: 30px 0; 
          padding: 20px; 
          border-left: 4px solid #dc2626; 
          background: #fef2f2;
        }
        .critical-section {
          margin: 30px 0; 
          padding: 20px; 
          border-left: 4px solid #f59e0b; 
          background: #fffbeb;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin: 20px 0;
        }
        .info-card {
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        .info-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .info-value {
          font-weight: bold;
          color: #1f2937;
        }
        .priority-banner {
          background: ${
            data.metadata?.riskLevel === "HIGH" ||
            data.summary?.redFlagRiskLevel === "HIGH"
              ? "#fee2e2"
              : data.metadata?.riskLevel === "MEDIUM"
                ? "#fef3c7"
                : "#f0fdf4"
          };
          border: 2px solid ${
            data.metadata?.riskLevel === "HIGH" ||
            data.summary?.redFlagRiskLevel === "HIGH"
              ? "#dc2626"
              : data.metadata?.riskLevel === "MEDIUM"
                ? "#d97706"
                : "#059669"
          };
          color: ${
            data.metadata?.riskLevel === "HIGH" ||
            data.summary?.redFlagRiskLevel === "HIGH"
              ? "#7f1d1d"
              : data.metadata?.riskLevel === "MEDIUM"
                ? "#92400e"
                : "#064e3b"
          };
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
          font-weight: bold;
        }
        h1, h2, h3 { color: #1f2937; }
        h3 { border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .risk-high { color: #dc2626; font-weight: bold; }
        .risk-medium { color: #d97706; font-weight: bold; }
        .risk-low { color: #059669; font-weight: bold; }
        @media print {
          body { margin: 10px; }
          .header { background: #dc2626 !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>LAPORAN INVESTIGASI CARBON STOCK</h1>
        <h2>PPATK - Pusat Pelaporan dan Analisis Transaksi Keuangan</h2>
        <p>Investigation Report with CarbonSensingAI</p>
        <p>Generated: ${new Date().toLocaleDateString("id-ID", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</p>
    </div>
    
    <div class="priority-banner">
        🚨 INVESTIGATION PRIORITY: ${
          data.metadata?.riskLevel === "HIGH" ||
          data.summary?.redFlagRiskLevel === "HIGH"
            ? "HIGH RISK"
            : data.metadata?.riskLevel === "MEDIUM"
              ? "MEDIUM RISK"
              : "LOW RISK"
        } 
        ${data.redFlagAnalysis ? "| RED FLAG ANALYSIS INCLUDED" : ""}
    </div>
    
    <div class="section">
        <h3>🔍 Project Information & Risk Assessment</h3>
        <div class="info-grid">
            <div class="info-card">
                <div class="info-label">Judul Kegiatan</div>
                <div class="info-value">${data.content?.judul_kegiatan || "N/A"}</div>
            </div>
            <div class="info-card">
                <div class="info-label">Pemilik</div>
                <div class="info-value">${data.content?.pemilik || "N/A"}</div>
            </div>
            <div class="info-card">
                <div class="info-label">Lokasi</div>
                <div class="info-value">${data.content?.lokasi || "N/A"}</div>
            </div>
        </div>
    </div>
    
    
    <div class="section">
        <h3>📊 Land Use Change Analysis</h3>
        ${lulcTableHTML}
    </div>
    
    <div class="section">
        <h3>🌱 Carbon Pool Analysis (CarbonSensingAI)</h3>
        ${carbonPoolTableHTML}
    </div>
    
    <div class="section">
        <h3>⚖️ LCAM vs AI Comparison & Discrepancy Analysis</h3>
        ${comparisonTableHTML}
    </div>
    
    <div class="section">
        <h3>💰 Carbon Pricing Valuation & Economic Impact</h3>
        ${carbonPricingTableHTML}
    </div>
    
    ${
      data.anomalyDetection?.anomalyNarrative
        ? `
    <div class="section">
        <h3>🤖 AI-Powered Anomaly Detection</h3>
        <div style="padding: 15px; background: white; border-radius: 8px; white-space: pre-wrap;">
${removeBoldMarkdown(data.anomalyDetection.anomalyNarrative) || "Data tidak tersedia"}
        </div>
        
        ${
          data.anomalyDetection?.integratedRedFlagNarrative
            ? `
        <div style="margin-top: 15px; padding: 15px; background: #fef3c7; border-radius: 8px;">
            <h4 style="color: #92400e; margin-bottom: 10px;">🔍 Integrated Red Flag Analysis</h4>
            <div style="white-space: pre-wrap; font-size: 14px;">
${removeBoldMarkdown(data.anomalyDetection.integratedRedFlagNarrative)}
            </div>
        </div>`
            : ""
        }
    </div>`
        : ""
    }
    
    <!-- ENHANCED RED FLAG SECTIONS -->
    ${
      data.content?.environmental_red_flags
        ? `
    <div class="red-flag-section">
        <h3>🌿 Environmental Red Flag Analysis</h3>
        <div style="padding: 15px; background: white; border-radius: 8px; white-space: pre-wrap;">
${removeBoldMarkdown(data.content.environmental_red_flags)}
        </div>
    </div>`
        : ""
    }
    
    ${
      data.content?.financial_red_flags
        ? `
    <div class="red-flag-section">
        <h3>💰 Financial Red Flag Analysis</h3>
        <div style="padding: 15px; background: white; border-radius: 8px; white-space: pre-wrap;">
${removeBoldMarkdown(data.content.financial_red_flags)}
        </div>
    </div>`
        : ""
    }
  
    
    <div class="critical-section">
        <h3>💡 Investigation Recommendations & Action Plan</h3>
        <div style="padding: 15px; background: white; border-radius: 8px; white-space: pre-wrap;">
${removeBoldMarkdown(data.content?.recomendation) || "Data tidak tersedia"}
        </div>
    </div>
    
    <!-- INVESTIGATION SUMMARY -->
    <div class="priority-banner">
        <h3 style="margin: 0; color: inherit;">📊 INVESTIGATION SUMMARY</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; text-align: left;">
            <div>
                <strong>Overall Risk:</strong> ${data.metadata?.riskLevel || "Unknown"}<br>
                <strong>Red Flag Risk:</strong> ${data.summary?.redFlagRiskLevel || "Not analyzed"}<br>
                <strong>Investigation Priority:</strong> ${
                  data.metadata?.riskLevel === "HIGH" ||
                  data.summary?.redFlagRiskLevel === "HIGH"
                    ? "URGENT"
                    : data.metadata?.riskLevel === "MEDIUM"
                      ? "HIGH"
                      : "MEDIUM"
                }
            </div>
            <div>
                <strong>Area Analyzed:</strong> ${data.summary?.totalArea || "Unknown"} ha<br>
                <strong>Analysis Years:</strong> ${data.summary?.analysisYears || 0} years<br>
                <strong>Economic Impact:</strong> ${data.anomalyDetection?.economicImpact ? `Rp ${data.anomalyDetection.economicImpact.toLocaleString()}` : "To be determined"}
            </div>
            <div>
                <strong>Red Flag Analyses:</strong> ${Object.values(data.redFlagAnalysis || {}).filter(Boolean).length || 0}<br>
                <strong>Data Sources:</strong> ${data.summary?.hasComparison ? "Complete" : "Partial"}<br>
                <strong>AI Anomaly Detection:</strong> ${data.summary?.hasAnomalyDetection ? "Included" : "Not performed"}
            </div>
        </div>
    </div>
    
    <div style="margin-top: 40px; padding: 20px; background: #f1f5f9; border-radius: 8px; text-align: center; color: #64748b;">
        <small>
            <strong>Carbon Stock Investigation Report</strong><br>
            Generated with CarbonSensingAI by SpasialAI<br>
            Report ID: ${data.metadata?.reportId || "Unknown"}<br>
            ${new Date().toISOString()}<br><br>
            <em>This report contains confidential investigation findings. Distribution is restricted to authorized personnel only.</em>
        </small>
    </div>
</body>
</html>`;

    // Generate filename with risk level indicator
    const riskLevel =
      data.metadata?.riskLevel || data.summary?.redFlagRiskLevel || "UNKNOWN";
    const projectName = (data.content?.judul_kegiatan || "CarbonStockReport")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 50);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `PPATK_Investigation_${riskLevel}_${projectName}_${timestamp}.html`;

    // Download the HTML file
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(
      "Enhanced HTML report with red flag integration generated successfully",
    );
  } catch (error) {
    console.error("Error generating enhanced HTML report:", error);
    alert("Terjadi kesalahan saat membuat laporan HTML yang enhanced.");
  }
}
// MAIN COMPONENT: CarbonStockReport
export const CarbonStockReport: FC<{
  part: ToolPart<"data-carbon-stock-report">;
  className?: string;
}> = ({ part, className }) => {
  // Helper functions
  function formatDate(dateString: string | undefined): string {
    if (!dateString) return new Date().toLocaleDateString("id-ID");

    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  }

  function formatNumber(num: number | undefined): string {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString("id-ID");
  }

  function getPriorityLevel(riskLevel: string | undefined): {
    level: string;
    color: string;
    icon: any;
    description: string;
  } {
    switch (riskLevel) {
      case "HIGH":
        return {
          level: "HIGH RISK",
          color: "bg-red-50 text-red-700 border-red-200",
          icon: AlertCircle,
          description:
            "Critical investigation required - potential fraud detected",
        };
      case "MEDIUM":
        return {
          level: "MEDIUM RISK",
          color: "bg-yellow-50 text-yellow-700 border-yellow-200",
          icon: AlertCircle,
          description: "Enhanced monitoring required - discrepancies found",
        };
      default:
        return {
          level: "LOW RISK",
          color: "bg-green-50 text-green-700 border-green-200",
          icon: CheckCircle,
          description: "Standard monitoring - no critical issues detected",
        };
    }
  }

  // State: In Progress
  if (part.data.state === "in-progress") {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div className="flex-1">
            <h4 className="font-medium">{part.data.name}</h4>
            <p className="text-sm text-muted-foreground">
              Generating comprehensive carbon stock report...
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
              {part.data.error || "Failed to generate carbon stock report"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // State: Completed
  const { metadata, summary, content, redFlagAnalysis, anomalyDetection } =
    part.data;
  const priority = getOverallPriority(
    metadata?.riskLevel,
    summary?.redFlagRiskLevel,
  );

  const PriorityIcon = priority.icon;

  // Debug: Log the content structure
  console.log("Report content structure:", content);
  console.log(
    "LULC data type:",
    typeof content?.remote_sensing_land_use_change,
  );
  console.log("LULC data:", content?.remote_sensing_land_use_change);

  if (part.data.state === "completed") {
    return (
      <Card className={cn("p-4", className)}>
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 border border-red-200">
            <Zap className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{part.data.name}</h4>
              <Badge className={priority.color}>
                <PriorityIcon className="h-3 w-3 mr-1" />
                {priority.level}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {priority.description}
            </p>

            {/* Project Summary */}
            {summary && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border mb-3">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Investigation Target
                </div>
                <div className="font-medium text-sm text-gray-900 mb-2">
                  {summary.projectTitle}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-600">Total Area</div>
                    <div className="font-bold text-blue-600">
                      {summary.totalArea} ha
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Analysis Years</div>
                    <div className="font-bold text-blue-600">
                      {summary.analysisYears} years
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-600">
                    Key Findings Preview
                  </div>
                  <div className="text-xs text-gray-800 line-clamp-2">
                    {summary.keyFindings}
                  </div>
                </div>
              </div>
            )}
            {/* Stats */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-3">
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-3">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Complete Report
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {summary?.hasComparison
                    ? "With Comparison"
                    : "Basic Analysis"}
                </span>
                {/* TAMBAHAN BARU */}
                {summary?.hasRedFlagAnalysis && (
                  <span className="flex items-center gap-1">
                    <Flag className="h-3 w-3 text-red-600" />
                    {
                      Object.values(redFlagAnalysis || {}).filter(Boolean)
                        .length
                    }{" "}
                    Red Flag Analyses
                  </span>
                )}
                {summary?.hasAnomalyDetection && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-purple-600" />
                    AI Anomaly Detection
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(
                    metadata?.generatedDate || new Date().toISOString(),
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Ready for Download
                </span>
              </div>
            </div>
          </div>

          {/* FIXED: Download buttons with proper functions */}
          <div className="flex gap-1">
            <Button
              onClick={() =>
                generateHTMLReportWithRedFlagIntegration(part.data)
              } // GANTI dari generateHTMLReportWithStructuredData
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              size="sm"
            >
              <Download className="h-4 w-4 mr-1" />
              HTML Report {/* GANTI dari HTML */}
            </Button>
          </div>
        </div>

        {/* Data Source Summary */}
        {metadata && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-2">
                  <PieChart className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Analysis Coverage</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coverage Area:</span>
                    <span className="font-medium">
                      {formatNumber(metadata.coverageArea)} ha
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Analysis Years:</span>
                    <span className="font-medium">
                      {metadata.analysisYears?.length || 0} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Assessment:</span>
                    <span
                      className={`font-medium ${
                        metadata.riskLevel === "HIGH"
                          ? "text-red-600"
                          : metadata.riskLevel === "MEDIUM"
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {metadata.riskLevel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Data Sources</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Carbon Analysis:</span>
                    <span className="font-medium text-green-600">
                      ✓ Available
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">LCAM Document:</span>
                    <span className="font-medium text-green-600">
                      ✓ Available
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comparison:</span>
                    <span className="font-medium text-green-600">
                      {summary?.hasComparison ? "✓ Available" : "⚠ Basic"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">LULC Table:</span>
                    <span className="font-medium text-green-600">
                      {content?.remote_sensing_land_use_change
                        ? "✓ Structured"
                        : "⚠ Legacy"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return null;
};
