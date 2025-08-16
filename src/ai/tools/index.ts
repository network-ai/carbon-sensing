// index.ts (Cleaned)
import { analyzeCarbonStock } from "./analyze-carbon-stock";
import { compareMarketableCarbonCredits } from "./compare-carbon-credits";
import { findAnomaly } from "./find-anomaly";
import { findLocation } from "./find-location";
import { generateEnvironmentalRedFlag1 } from "./generate-environmental-redflag1";
import { generateEnvironmentalRedFlag2 } from "./generate-environmental-redflag2";
import { generateFinancialRedFlag1 } from "./generate-financial-redflag1";
import { generateFinancialRedFlag2 } from "./generate-financial-redflag2";
import { generateIntegratedCriticalFindings } from "./generate-integrated-redflag";
import { generateCarbonStockReport } from "./generate-report";
import { getWeather } from "./get-weather";
import { uploadGeoJSON } from "./upload-geojson";
import { uploadLCAMPdf } from "./upload-lcam-pdf";

export const tools = {
  "find-location": findLocation,
  "get-weather": getWeather,
  "upload-geojson": uploadGeoJSON,
  "analyze-carbon-stock": analyzeCarbonStock,
  analyze: analyzeCarbonStock, // Alias
  "upload-lcam-pdf": uploadLCAMPdf,
  "compare-carbon-credits": compareMarketableCarbonCredits,
  compare: compareMarketableCarbonCredits, // Alias
  "report-carbon-stock": generateCarbonStockReport,
  report: generateCarbonStockReport, // Alias
  generate: generateCarbonStockReport, // Alias
  "generate-report": generateCarbonStockReport, // Alias
  upload: uploadLCAMPdf, // Alias
  "find-anomaly": findAnomaly,
  "generate-environmental-redflag1": generateEnvironmentalRedFlag1,
  "generate-environmental-redflag2": generateEnvironmentalRedFlag2,
  "generate-financial-redflag1": generateFinancialRedFlag1,
  "generate-financial-redflag2": generateFinancialRedFlag2,
  "generate-redflag": generateIntegratedCriticalFindings,
};

export type Tools = {
  [K in keyof typeof tools]: ReturnType<(typeof tools)[K]>;
};
