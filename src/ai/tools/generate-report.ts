// generate-report-enhanced.ts - IMPROVED VERSION
import type { CreateToolsContext } from "@/ai";
import { generateObject, tool } from "ai";
import { ulid } from "ulid";
import z from "zod";

// Import helper functions
import { documentParseModel } from "../provider";
import {
  findCarbonStockAnalysis,
  findComparisonData,
  findLCAMExtraction,
  findRedFlagAnalysis,
  generateCarbonPoolTable,
  generateComparisonTable,
  generateLandUseChangeTable,
} from "./carbon-analyze-helper";

export const generateCarbonStockReport = (ctx: CreateToolsContext) =>
  tool({
    name: "generate-carbon-stock-report",
    description:
      "Generate comprehensive carbon stock analysis report with integrated AI-powered anomaly detection and red flag analysis for PPATK investigation purposes",
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
      reportTitle: z
        .string()
        .optional()
        .nullable()
        .describe("Custom report title (default: auto-generated)"),
      includeRawData: z
        .boolean()
        .default(false)
        .describe("Include raw data sections in the report"),
      anomalyFocusArea: z
        .enum(["financial_crime", "technical_anomaly", "comprehensive"])
        .default("comprehensive")
        .describe("Focus area for anomaly detection"),
      includeAnomalyDetection: z
        .boolean()
        .default(true)
        .describe("Include AI-powered anomaly detection in the report"),
      includeRedFlags: z
        .boolean()
        .default(true)
        .describe("Include comprehensive red flag analysis"),
    }),
    execute: async ({
      carbonStockAnalysisId,
      lcamDocumentId,
      comparisonAnalysisId,
      reportTitle,
      includeRawData,
      anomalyFocusArea,
      includeAnomalyDetection,
      includeRedFlags,
    }) => {
      const reportId = ulid();
      const reportName =
        reportTitle ||
        "Comprehensive Carbon Stock Investigation Report with Red Flag Analysis";

      ctx.writer.write({
        id: reportId,
        type: "data-carbon-stock-report",
        data: {
          name: `Generating: ${reportName}`,
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

        // Find comparison data (optional)
        const comparisonData = findComparisonData(
          ctx.chat.id,
          comparisonAnalysisId,
        );

        // ENHANCED: Find all red flag analyses
        const redFlagResults = await findAllRedFlagAnalyses(ctx.chat.id);
        console.log("🔍 Red flag results found:", {
          env1: !!redFlagResults.environmentalRedFlag1,
          env2: !!redFlagResults.environmentalRedFlag2,
          fin1: !!redFlagResults.financialRedFlag1,
          fin2: !!redFlagResults.financialRedFlag2,
          integrated: !!redFlagResults.integratedFindings,
          anomaly: !!redFlagResults.anomalyDetection,
        });

        // Generate AI-powered anomaly detection if enabled
        let anomalyDetectionResult = null;
        if (includeAnomalyDetection) {
          anomalyDetectionResult = await generateAnomalyDetectionForReport(
            carbonData,
            lcamData,
            comparisonData,
            anomalyFocusArea,
            redFlagResults,
          );
        }

        // Generate comprehensive report content with full red flag integration
        const reportContent = generateEnhancedReportContent(
          carbonData,
          lcamData,
          comparisonData,
          anomalyDetectionResult,
          redFlagResults,
          includeRedFlags,
        );

        // Calculate overall risk level considering all factors
        const overallRiskLevel = calculateComprehensiveRiskLevel(
          carbonData,
          lcamData,
          comparisonData,
          anomalyDetectionResult,
          redFlagResults,
        );

        // Create final report structure
        const finalReport = {
          metadata: {
            reportTitle: reportName,
            generatedDate: new Date().toISOString(),
            reportId,
            dataSources: {
              carbonAnalysisId: carbonStockAnalysisId || "latest",
              lcamDocumentId: lcamDocumentId || "latest",
              comparisonAnalysisId: comparisonAnalysisId || "not_used",
            },
            redFlagAnalysis: {
              included: includeRedFlags,
              environmentalRedFlag1: !!redFlagResults.environmentalRedFlag1,
              environmentalRedFlag2: !!redFlagResults.environmentalRedFlag2,
              financialRedFlag1: !!redFlagResults.financialRedFlag1,
              financialRedFlag2: !!redFlagResults.financialRedFlag2,
              integratedFindings: !!redFlagResults.integratedFindings,
              anomalyDetection: !!redFlagResults.anomalyDetection,
              totalAnalysesUsed:
                Object.values(redFlagResults).filter(Boolean).length,
            },
            coverageArea: carbonData.measurementArea,
            analysisYears: carbonData.analyzedYears,
            riskLevel: overallRiskLevel,
            anomalyDetectionEnabled: includeAnomalyDetection,
            anomalyFocusArea: anomalyFocusArea,
          },
          content: reportContent,
          anomalyDetection: anomalyDetectionResult,
          redFlagAnalysis: includeRedFlags ? redFlagResults : null,
          ...(includeRawData && {
            rawData: {
              carbonStockData: carbonData,
              lcamExtractedData: lcamData.extractedData,
              comparisonData: comparisonData,
              redFlagData: includeRedFlags ? redFlagResults : null,
            },
          }),
        };

        ctx.writer.write({
          id: reportId,
          type: "data-carbon-stock-report",
          data: {
            name: reportName,
            state: "completed",
            metadata: finalReport.metadata,
            content: finalReport.content,
            anomalyDetection: finalReport.anomalyDetection,
            redFlagAnalysis: finalReport.redFlagAnalysis,
            summary: {
              projectTitle: reportContent.judul_kegiatan,
              riskLevel: overallRiskLevel,
              totalArea: reportContent.total_area,
              analysisYears: carbonData.analyzedYears?.length || 0,
              hasComparison: !!comparisonData,
              hasAnomalyDetection: !!anomalyDetectionResult,
              hasRedFlagAnalysis:
                includeRedFlags && Object.values(redFlagResults).some(Boolean),
              redFlagRiskLevel: determineRedFlagRiskLevel(redFlagResults),
              keyFindings:
                anomalyDetectionResult?.keyFindings?.join("; ") ||
                "Standard analysis completed",
            },
            processingDetails: {
              generationTime: Date.now(),
              dataSourcesUsed: Object.keys(finalReport.metadata.dataSources),
              includeRawData,
              contentSections: Object.keys(reportContent).length,
              hasStructuredTables: true,
              hasAnomalyDetection: !!anomalyDetectionResult,
              hasRedFlagAnalysis: includeRedFlags,
              redFlagAnalysesCount:
                Object.values(redFlagResults).filter(Boolean).length,
            },
            ...(includeRawData && {
              rawData: finalReport.rawData,
            }),
            report: finalReport,
          },
        });

        return {
          success: true,
          message: `Enhanced carbon stock report "${reportName}" generated successfully with ${includeAnomalyDetection ? "AI-powered anomaly detection" : "standard analysis"}${includeRedFlags ? " and comprehensive red flag analysis" : ""}`,
          reportId,
          summary: {
            projectTitle: reportContent.judul_kegiatan,
            riskLevel: overallRiskLevel,
            totalArea: reportContent.total_area,
            hasComparison: !!comparisonData,
            hasAnomalyDetection: !!anomalyDetectionResult,
            hasRedFlagAnalysis:
              includeRedFlags && Object.values(redFlagResults).some(Boolean),
            investigationPriority:
              anomalyDetectionResult?.investigationPriority || "MEDIUM",
            economicImpact: anomalyDetectionResult?.economicImpact || 0,
            sectionsGenerated: Object.keys(reportContent).length,
            redFlagSummary: includeRedFlags
              ? generateRedFlagSummary(redFlagResults)
              : null,
          },
        };
      } catch (error) {
        ctx.writer.write({
          id: reportId,
          type: "data-carbon-stock-report",
          data: {
            name: `Error: ${reportName}`,
            state: "failed",
            error:
              error instanceof Error
                ? error.message
                : "Failed to generate enhanced carbon stock report",
          },
        });

        throw error;
      }
    },
  });

/**
 * ENHANCED: Find all red flag analyses from the chat
 */
async function findAllRedFlagAnalyses(chatId: string): Promise<{
  environmentalRedFlag1?: any;
  environmentalRedFlag2?: any;
  financialRedFlag1?: any;
  financialRedFlag2?: any;
  integratedFindings?: any;
  anomalyDetection?: any;
}> {
  console.log("🔍 Searching for all red flag analyses in chat:", chatId);

  try {
    // Find all individual red flag analyses
    const env1 = findRedFlagAnalysis(chatId, "data-environmental-red-flag-1");
    const env2 = findRedFlagAnalysis(chatId, "data-environmental-red-flag-2");
    const fin1 = findRedFlagAnalysis(chatId, "data-financial-red-flag-1");
    const fin2 = findRedFlagAnalysis(chatId, "data-financial-red-flag-2");
    const integrated = findRedFlagAnalysis(
      chatId,
      "data-integrated-critical-findings",
    );
    const anomaly = findRedFlagAnalysis(chatId, "data-anomaly-detection");

    console.log("Red flag search results:", {
      env1: !!env1,
      env2: !!env2,
      fin1: !!fin1,
      fin2: !!fin2,
      integrated: !!integrated,
      anomaly: !!anomaly,
    });

    return {
      environmentalRedFlag1: env1?.data || env1,
      environmentalRedFlag2: env2?.data || env2,
      financialRedFlag1: fin1?.data || fin1,
      financialRedFlag2: fin2?.data || fin2,
      integratedFindings: integrated?.data || integrated,
      anomalyDetection: anomaly?.data || anomaly,
    };
  } catch (error) {
    console.error("Error finding red flag analyses:", error);
    return {};
  }
}

/**
 * ENHANCED: Generate AI-powered anomaly detection with red flag integration
 */
async function generateAnomalyDetectionForReport(
  carbonData: any,
  lcamData: any,
  comparisonData: any,
  focusArea: "financial_crime" | "technical_anomaly" | "comprehensive",
  redFlagResults: any,
) {
  try {
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
        comparisonData?.totalComparison?.totalCarbonSensingSequestration || 0,
      avgDiscrepancy:
        comparisonData?.summaryStatistics?.averageDiscrepancyPercentage || 0,
      comparisonTable: comparisonData?.tableData?.slice(0, 5) || [],
      carbonPoolTable: carbonData.carbonPoolTableData?.slice(0, 5) || [],
      lulcTable: carbonData.lulcTableData?.slice(0, 10) || [],
    };

    const discrepancyValue = Math.abs(
      analysisData.totalLCAM - analysisData.totalAI,
    );
    const economicValue = discrepancyValue * 50000;

    // Create enhanced prompt with red flag integration
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
- Economic Impact: Rp ${economicValue.toLocaleString()}`;

    // Add red flag analysis data to prompt
    if (redFlagResults && Object.values(redFlagResults).some(Boolean)) {
      prompt += `\n\n**INTEGRATED RED FLAG ANALYSIS:**`;

      if (redFlagResults.integratedFindings) {
        prompt += `\n**Overall Assessment:** ${redFlagResults.integratedFindings.executiveSummary || "Integrated analysis available"}`;
        prompt += `\n**Risk Level:** ${redFlagResults.integratedFindings.overallRiskLevel || "Unknown"}`;
      }

      if (redFlagResults.environmentalRedFlag1) {
        prompt += `\n**Environmental Red Flag 1:** ${redFlagResults.environmentalRedFlag1.redFlagNarrative?.substring(0, 200) || "Carbon activity analysis available"}...`;
      }

      if (redFlagResults.environmentalRedFlag2) {
        prompt += `\n**Environmental Red Flag 2:** ${redFlagResults.environmentalRedFlag2.redFlagNarrative?.substring(0, 200) || "Land dispute analysis available"}...`;
      }

      if (redFlagResults.financialRedFlag1) {
        prompt += `\n**Financial Red Flag 1:** ${redFlagResults.financialRedFlag1.redFlagNarrative?.substring(0, 200) || "PEPs analysis available"}...`;
      }

      if (redFlagResults.financialRedFlag2) {
        prompt += `\n**Financial Red Flag 2:** ${redFlagResults.financialRedFlag2.methodologyNarrative?.substring(0, 200) || "Trading pattern analysis available"}...`;
      }

      if (redFlagResults.anomalyDetection) {
        prompt += `\n**Previous Anomaly Detection:** Risk Level ${redFlagResults.anomalyDetection.riskLevel || "Unknown"}`;
      }
    }

    // Add focus area instructions
    if (focusArea === "financial_crime") {
      prompt += `\n\n**FOKUS ANALISIS: FINANCIAL CRIME DETECTION WITH RED FLAGS**
Integrasikan semua temuan red flag untuk menghasilkan narasi yang berfokus pada:
1. Skema kejahatan finansial berdasarkan red flag finansial
2. Pola over-claiming yang dikonfirmasi oleh red flag lingkungan
3. Money laundering melalui carbon credit dengan dukungan red flag
4. Cross-verification antara red flag dan data teknis
5. Estimasi kerugian dengan red flag sebagai multiplier risk
6. Rekomendasi investigasi terintegrasi`;
    }

    prompt += `\n\n**FORMAT OUTPUT - TERINTEGRASI:**
- Gunakan bahasa Indonesia formal investigatif
- 6-8 paragraf (1200-1500 kata) dengan integrasi red flag penuh
- Referensikan temuan red flag spesifik dalam narasi
- Berikan cross-verification antara red flag dan data teknis
- Risk assessment yang mempertimbangkan semua red flag
- Actionable findings dengan prioritas berdasarkan red flag severity

Buatlah analisis anomali yang mengintegrasikan SEMUA temuan red flag:`;

    // Generate comprehensive anomaly detection
    const result = await generateObject({
      model: documentParseModel,
      system:
        "You are an expert forensic analyst for PPATK. Integrate all available red flag analyses with carbon stock data to generate comprehensive anomaly detection narratives for financial crime investigation.",
      prompt: prompt,
      schema: z.object({
        anomalyNarrative: z
          .string()
          .describe(
            "Comprehensive narrative integrating all red flag findings with anomaly detection",
          ),
        riskLevel: z
          .enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
          .describe("Overall risk assessment"),
        keyFindings: z
          .array(z.string())
          .describe("Key anomalies and red flags detected"),
        economicImpact: z.number().describe("Estimated economic impact in IDR"),
        investigationPriority: z
          .enum(["URGENT", "HIGH", "MEDIUM", "LOW"])
          .describe("Investigation priority"),
        recommendedActions: z
          .array(z.string())
          .describe("Recommended actions for PPATK"),
        redFlagIntegration: z.object({
          environmentalConcerns: z.array(z.string()),
          financialConcerns: z.array(z.string()),
          crossCuttingIssues: z.array(z.string()),
          overallRedFlagImpact: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
        }),
      }),
    });

    return {
      ...result.object,
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
      redFlagIntegration: result.object.redFlagIntegration,
      focusArea: focusArea,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to generate enhanced anomaly detection:", error);
    return null;
  }
}

/**
 * ENHANCED: Generate comprehensive report content with full red flag integration
 */
function generateEnhancedReportContent(
  carbonData: any,
  lcamData: any,
  comparisonData?: any,
  anomalyResult?: any,
  redFlagResults?: any,
  includeRedFlags: boolean = true,
): any {
  const extractedData = lcamData.extractedData || {};

  // Basic project information
  const judul_kegiatan =
    extractedData.informasi_umum?.judul_kegiatan ||
    extractedData.ringkasan_eksekutif?.judul_kegiatan_aksi_mitigasi ||
    "Project Title Not Available";

  const pemilik =
    extractedData.informasi_umum?.pemilik_kegiatan?.project_owner ||
    "Not specified";
  const lokasi =
    extractedData.informasi_umum?.alamat_dan_lokasi?.lokasi_tapak ||
    "Location not specified";
  const latitude =
    extractedData.informasi_umum?.alamat_dan_lokasi?.latitude ||
    "Not specified";
  const longitude =
    extractedData.informasi_umum?.alamat_dan_lokasi?.longitude ||
    "Not specified";
  const total_area =
    extractedData.ringkasan_eksekutif?.total_area ||
    carbonData.measurementArea?.toFixed(2) ||
    "Not specified";
  const vegetasi_area =
    extractedData.ringkasan_eksekutif?.area_bervegetasi || "Not specified";
  const deskripsi_singkat =
    extractedData.informasi_umum?.deskripsi_ringkas ||
    "Description not available";
  const tujuan_umum_khusus =
    extractedData.informasi_umum?.tujuan_umum_dan_khusus ||
    "Objectives not specified";
  const partner_teknis =
    extractedData.informasi_umum?.pemilik_kegiatan?.technical_partner ||
    "Not specified";
  const partner_komunitas =
    extractedData.informasi_umum?.pemilik_kegiatan?.community_partner ||
    "Not specified";
  const periode_penataan =
    extractedData.ringkasan_eksekutif?.periode_penaatan || "Not specified";
  const periode_pelaporan =
    extractedData.ringkasan_eksekutif?.periode_laporan_pemantauan ||
    "Not specified";

  // Generate analysis sections using helper functions
  const remote_sensing_land_use_change = generateLandUseChangeTable(carbonData);
  const remote_sensing_carbon_pool = generateCarbonPoolTable(carbonData);
  const compare_carbon_stock_lcam_remote_sensing = generateComparisonTable(
    carbonData,
    extractedData,
    comparisonData,
  );

  // Generate other report sections
  const potential_credit_carbon = generatePotentialCarbonCredits(
    carbonData,
    comparisonData,
  );
  const carbon_pricing_economic_valuation = generateCarbonPricingValuation(
    carbonData,
    comparisonData,
  );

  // ENHANCED: Use AI-generated anomaly detection with red flag integration
  const anomaly_detection = anomalyResult
    ? generateEnhancedAnomalySection(anomalyResult)
    : generateAnomalyDetection(carbonData, extractedData, comparisonData);

  // ENHANCED: Generate comprehensive critical findings with ALL red flags
  const critical_finding = generateComprehensiveCriticalFindings(
    carbonData,
    lcamData,
    comparisonData,
    anomalyResult,
    redFlagResults,
    includeRedFlags,
  );

  // ENHANCED: Add dedicated red flag sections
  const red_flag_analysis = includeRedFlags
    ? generateRedFlagAnalysisSection(redFlagResults)
    : null;
  const environmental_red_flags = includeRedFlags
    ? generateEnvironmentalRedFlagSection(redFlagResults)
    : null;
  const financial_red_flags = includeRedFlags
    ? generateFinancialRedFlagSection(redFlagResults)
    : null;
  const integrated_red_flag_findings = includeRedFlags
    ? generateIntegratedRedFlagSection(redFlagResults)
    : null;

  // Generate conclusions and recommendations with red flag integration
  const conclusion = generateEnhancedConclusion(
    carbonData,
    extractedData,
    comparisonData,
    anomalyResult,
    redFlagResults,
  );
  const recomendation = generateEnhancedRecommendations(
    anomalyResult,
    redFlagResults,
  );

  // Add personnel sections
  const pemilik_persons = generatePersonnelSection("owner", extractedData);
  const partner_teknis_persons = generatePersonnelSection(
    "technical",
    extractedData,
  );
  const verification_teams_person = generatePersonnelSection(
    "verification",
    extractedData,
  );

  // Add additional analysis sections
  const no_activity = generateActivityAnalysis(carbonData, extractedData);
  const overlap_hutan_lindung = generateForestOverlapAnalysis(
    carbonData,
    extractedData,
  );
  const political_actor = generatePoliticalActorAnalysis(extractedData);
  const individual_transaction = generateTransactionAnalysis(extractedData);

  const reportContent = {
    judul_kegiatan,
    pemilik,
    lokasi,
    latitude,
    longitude,
    total_area,
    vegetasi_area,
    deskripsi_singkat,
    tujuan_umum_khusus,
    partner_teknis,
    partner_komunitas,
    periode_penataan,
    periode_pelaporan,
    remote_sensing_land_use_change,
    remote_sensing_carbon_pool,
    compare_carbon_stock_lcam_remote_sensing,
    potential_credit_carbon,
    carbon_pricing_economic_valuation,
    anomaly_detection,
    critical_finding,
    no_activity,
    overlap_hutan_lindung,
    political_actor,
    individual_transaction,
    pemilik_persons,
    partner_teknis_persons,
    verification_teams_person,
    conclusion,
    recomendation,
  };

  // Add red flag sections if included
  if (includeRedFlags && red_flag_analysis) {
    Object.assign(reportContent, {
      red_flag_analysis,
      environmental_red_flags,
      financial_red_flags,
      integrated_red_flag_findings,
    });
  }

  return reportContent;
}

/**
 * Generate comprehensive critical findings with ALL red flag integration
 */
function generateComprehensiveCriticalFindings(
  carbonData: any,
  lcamData: any,
  comparisonData?: any,
  anomalyResult?: any,
  redFlagResults?: any,
  includeRedFlags: boolean = true,
): string {
  const findings = [];

  // 1. AI Anomaly Detection Summary (if available)
  if (anomalyResult) {
    findings.push(
      `**🤖 AI-POWERED ANOMALY DETECTION (${anomalyResult.riskLevel}):**`,
    );
    findings.push(
      `**Investigation Priority:** ${anomalyResult.investigationPriority}`,
    );
    findings.push(
      `**Economic Impact:** Rp ${anomalyResult.economicImpact.toLocaleString()}`,
    );

    if (anomalyResult.keyFindings?.length > 0) {
      findings.push("**Key AI Findings:**");
      anomalyResult.keyFindings.forEach((finding: string) => {
        findings.push(`   • ${finding}`);
      });
    }
    findings.push("");
  }

  // 2. Integrated Red Flag Results (if available and included)
  if (includeRedFlags && redFlagResults?.integratedFindings) {
    const integrated = redFlagResults.integratedFindings;
    findings.push(
      `**🔍 INTEGRATED RED FLAG ANALYSIS (${integrated.overallRiskLevel || "UNKNOWN"}):**`,
    );

    if (integrated.crossCuttingIssues?.length > 0) {
      findings.push("**Cross-Cutting Issues:**");
      integrated.crossCuttingIssues.forEach((issue: string) => {
        findings.push(`   • ${issue}`);
      });
    }

    if (integrated.executiveSummary) {
      findings.push("**Executive Summary:**");
      findings.push(integrated.executiveSummary);
    }
    findings.push("");
  }

  // 3. Individual Red Flag Analysis Results (if included)
  if (includeRedFlags && redFlagResults) {
    // Environmental Red Flag 1 - Carbon Activity
    if (redFlagResults.environmentalRedFlag1) {
      const env1 = redFlagResults.environmentalRedFlag1;
      findings.push(
        `**🌿 ENVIRONMENTAL RED FLAG 1 - Carbon Activity (${env1.riskLevel || env1.severity || "MEDIUM"}):**`,
      );
      findings.push(
        env1.redFlagNarrative ||
          env1.methodologyNarrative ||
          "Carbon activity analysis completed",
      );
      findings.push("");
    }

    // Environmental Red Flag 2 - Land Disputes
    if (redFlagResults.environmentalRedFlag2) {
      const env2 = redFlagResults.environmentalRedFlag2;
      findings.push(
        `**🏞️ ENVIRONMENTAL RED FLAG 2 - Land Disputes (${env2.riskLevel || env2.severity || "MEDIUM"}):**`,
      );
      findings.push(
        env2.redFlagNarrative ||
          env2.methodologyNarrative ||
          "Land dispute analysis completed",
      );
      findings.push("");
    }

    // Financial Red Flag 1 - PEPs
    if (redFlagResults.financialRedFlag1) {
      const fin1 = redFlagResults.financialRedFlag1;
      findings.push(
        `**💰 FINANCIAL RED FLAG 1 - PEPs (${fin1.riskLevel || fin1.pepsSeverity || "MEDIUM"}):**`,
      );
      findings.push(
        fin1.redFlagNarrative ||
          fin1.methodologyNarrative ||
          "PEPs analysis completed",
      );
      findings.push("");
    }

    // Financial Red Flag 2 - Trading Patterns
    if (redFlagResults.financialRedFlag2) {
      const fin2 = redFlagResults.financialRedFlag2;
      findings.push(
        `**📊 FINANCIAL RED FLAG 2 - Trading Patterns (${fin2.riskLevel || "DEVELOPMENT"}):**`,
      );
      findings.push(
        fin2.redFlagNarrative ||
          fin2.methodologyNarrative ||
          "Trading pattern analysis completed",
      );
      findings.push("");
    }

    // Previous Anomaly Detection
    if (
      redFlagResults.anomalyDetection &&
      redFlagResults.anomalyDetection !== anomalyResult
    ) {
      const prevAnomaly = redFlagResults.anomalyDetection;
      findings.push(
        `**🔄 PREVIOUS ANOMALY DETECTION (${prevAnomaly.riskLevel || "UNKNOWN"}):**`,
      );
      if (prevAnomaly.keyFindings?.length > 0) {
        findings.push("**Previous Key Findings:**");
        prevAnomaly.keyFindings.slice(0, 3).forEach((finding: string) => {
          findings.push(`   • ${finding}`);
        });
      }
      findings.push("");
    }
  }

  // 4. Standard Technical Analysis (fallback)
  const standardFindings = generateStandardCriticalFindings(
    carbonData,
    lcamData,
    comparisonData,
  );
  if (
    standardFindings &&
    standardFindings !== "No critical technical issues identified."
  ) {
    findings.push("**📋 TECHNICAL ANALYSIS:**");
    findings.push(standardFindings);
    findings.push("");
  }

  // 5. Overall Assessment
  const overallRisk = determineOverallRisk(
    anomalyResult,
    redFlagResults,
    comparisonData,
  );
  findings.push(`**📈 OVERALL RISK ASSESSMENT: ${overallRisk}**`);

  // Add risk-based summary
  switch (overallRisk) {
    case "CRITICAL":
      findings.push(
        "🚨 **IMMEDIATE ACTION REQUIRED** - Multiple high-risk indicators detected across anomaly and red flag analyses",
      );
      break;
    case "HIGH":
      findings.push(
        "⚠️ **PRIORITY INVESTIGATION** - Significant red flags and anomalies identified",
      );
      break;
    case "MEDIUM":
      findings.push(
        "📋 **ENHANCED MONITORING** - Some concerns require attention based on analysis",
      );
      break;
    case "LOW":
      findings.push(
        "✅ **STANDARD MONITORING** - Minimal concerns identified across all analyses",
      );
      break;
  }

  return findings.join("\n");
}

/**
 * Generate dedicated red flag analysis section
 */
function generateRedFlagAnalysisSection(redFlagResults: any): string {
  if (!redFlagResults || !Object.values(redFlagResults).some(Boolean)) {
    return "**RED FLAG ANALYSIS:** No red flag analyses available for this project.";
  }

  const sections = [];
  sections.push("**🚩 COMPREHENSIVE RED FLAG ANALYSIS**");

  // Count available analyses
  const availableAnalyses =
    Object.values(redFlagResults).filter(Boolean).length;
  sections.push(`**Total Red Flag Analyses:** ${availableAnalyses}`);

  // Overall red flag risk assessment
  const overallRedFlagRisk = determineRedFlagRiskLevel(redFlagResults);
  sections.push(`**Overall Red Flag Risk Level:** ${overallRedFlagRisk}`);
  sections.push("");

  // Summary of each red flag type
  if (redFlagResults.environmentalRedFlag1) {
    sections.push(
      "✅ **Environmental Red Flag 1 (Carbon Activity):** Available",
    );
  }
  if (redFlagResults.environmentalRedFlag2) {
    sections.push("✅ **Environmental Red Flag 2 (Land Disputes):** Available");
  }
  if (redFlagResults.financialRedFlag1) {
    sections.push("✅ **Financial Red Flag 1 (PEPs):** Available");
  }
  if (redFlagResults.financialRedFlag2) {
    sections.push("✅ **Financial Red Flag 2 (Trading Patterns):** Available");
  }
  if (redFlagResults.integratedFindings) {
    sections.push("✅ **Integrated Critical Findings:** Available");
  }
  if (redFlagResults.anomalyDetection) {
    sections.push("✅ **Anomaly Detection:** Available");
  }

  return sections.join("\n");
}

/**
 * Generate environmental red flag section
 */
function generateEnvironmentalRedFlagSection(redFlagResults: any): string {
  if (!redFlagResults) return "";

  const sections = [];
  sections.push("**🌿 ENVIRONMENTAL RED FLAG ANALYSIS**");

  // Environmental Red Flag 1 - Carbon Activity
  if (redFlagResults.environmentalRedFlag1) {
    const env1 = redFlagResults.environmentalRedFlag1;
    sections.push("**RED FLAG 1: CARBON ACTIVITY ANALYSIS**");
    sections.push(
      `**Risk Level:** ${env1.riskLevel || env1.severity || "Not specified"}`,
    );

    if (env1.keyFindings?.length > 0) {
      sections.push("**Key Findings:**");
      env1.keyFindings.forEach((finding: string) => {
        sections.push(`• ${finding}`);
      });
    }

    if (env1.redFlagNarrative) {
      sections.push("**Analysis:**");
      sections.push(env1.redFlagNarrative);
    } else if (env1.methodologyNarrative) {
      sections.push("**Methodology:**");
      sections.push(env1.methodologyNarrative);
    }
    sections.push("");
  }

  // Environmental Red Flag 2 - Land Disputes
  if (redFlagResults.environmentalRedFlag2) {
    const env2 = redFlagResults.environmentalRedFlag2;
    sections.push("**RED FLAG 2: LAND DISPUTES ANALYSIS**");
    sections.push(
      `**Risk Level:** ${env2.riskLevel || env2.severity || "Not specified"}`,
    );

    if (env2.keyFindings?.length > 0) {
      sections.push("**Key Findings:**");
      env2.keyFindings.forEach((finding: string) => {
        sections.push(`• ${finding}`);
      });
    }

    if (env2.redFlagNarrative) {
      sections.push("**Analysis:**");
      sections.push(env2.redFlagNarrative);
    } else if (env2.methodologyNarrative) {
      sections.push("**Methodology:**");
      sections.push(env2.methodologyNarrative);
    }
    sections.push("");
  }

  if (sections.length <= 2) {
    return "**🌿 ENVIRONMENTAL RED FLAG ANALYSIS:** No environmental red flag analyses available.";
  }

  return sections.join("\n");
}

/**
 * Generate financial red flag section
 */
function generateFinancialRedFlagSection(redFlagResults: any): string {
  if (!redFlagResults) return "";

  const sections = [];
  sections.push("**💰 FINANCIAL RED FLAG ANALYSIS**");

  // Financial Red Flag 1 - PEPs
  if (redFlagResults.financialRedFlag1) {
    const fin1 = redFlagResults.financialRedFlag1;
    sections.push(
      "**RED FLAG 1: POLITICALLY EXPOSED PERSONS (PEPs) ANALYSIS**",
    );
    sections.push(
      `**Risk Level:** ${fin1.riskLevel || fin1.pepsSeverity || "Not specified"}`,
    );

    if (fin1.keyFindings?.length > 0) {
      sections.push("**Key Findings:**");
      fin1.keyFindings.forEach((finding: string) => {
        sections.push(`• ${finding}`);
      });
    }

    if (fin1.redFlagNarrative) {
      sections.push("**Analysis:**");
      sections.push(fin1.redFlagNarrative);
    } else if (fin1.methodologyNarrative) {
      sections.push("**Methodology:**");
      sections.push(fin1.methodologyNarrative);
    }
    sections.push("");
  }

  // Financial Red Flag 2 - Trading Patterns
  if (redFlagResults.financialRedFlag2) {
    const fin2 = redFlagResults.financialRedFlag2;
    sections.push("**RED FLAG 2: TRADING PATTERNS ANALYSIS**");
    sections.push(`**Status:** ${fin2.developmentStatus || "Development"}`);
    sections.push(`**Risk Level:** ${fin2.riskLevel || "Under Development"}`);

    if (fin2.keyFindings?.length > 0) {
      sections.push("**Key Findings:**");
      fin2.keyFindings.forEach((finding: string) => {
        sections.push(`• ${finding}`);
      });
    }

    if (fin2.redFlagNarrative) {
      sections.push("**Analysis:**");
      sections.push(fin2.redFlagNarrative);
    } else if (fin2.methodologyNarrative) {
      sections.push("**Methodology:**");
      sections.push(fin2.methodologyNarrative);
    }
    sections.push("");
  }

  if (sections.length <= 2) {
    return "**💰 FINANCIAL RED FLAG ANALYSIS:** No financial red flag analyses available.";
  }

  return sections.join("\n");
}

/**
 * Generate integrated red flag section
 */
function generateIntegratedRedFlagSection(redFlagResults: any): string {
  if (!redFlagResults?.integratedFindings) {
    return "**🔍 INTEGRATED RED FLAG FINDINGS:** No integrated analysis available.";
  }

  const integrated = redFlagResults.integratedFindings;
  const sections = [];

  sections.push("**🔍 INTEGRATED CRITICAL FINDINGS**");
  sections.push(
    `**Overall Risk Level:** ${integrated.overallRiskLevel || "Unknown"}`,
  );
  sections.push("");

  if (integrated.executiveSummary) {
    sections.push("**EXECUTIVE SUMMARY:**");
    sections.push(integrated.executiveSummary);
    sections.push("");
  }

  if (integrated.crossCuttingIssues?.length > 0) {
    sections.push("**CROSS-CUTTING ISSUES:**");
    integrated.crossCuttingIssues.forEach((issue: string) => {
      sections.push(`• ${issue}`);
    });
    sections.push("");
  }

  if (integrated.keyFindings?.length > 0) {
    sections.push("**KEY INTEGRATED FINDINGS:**");
    integrated.keyFindings.forEach((finding: string) => {
      sections.push(`• ${finding}`);
    });
    sections.push("");
  }

  if (integrated.recommendedActions?.length > 0) {
    sections.push("**RECOMMENDED ACTIONS:**");
    integrated.recommendedActions.forEach((action: string) => {
      sections.push(`• ${action}`);
    });
  }

  return sections.join("\n");
}

/**
 * Calculate comprehensive risk level considering all factors
 */
function calculateComprehensiveRiskLevel(
  carbonData: any,
  lcamData: any,
  comparisonData?: any,
  anomalyResult?: any,
  redFlagResults?: any,
): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  const riskFactors: string[] = [];

  // Add anomaly risk level
  if (anomalyResult?.riskLevel) {
    riskFactors.push(anomalyResult.riskLevel);
  }

  // Add integrated red flag risk level
  if (redFlagResults?.integratedFindings?.overallRiskLevel) {
    riskFactors.push(redFlagResults.integratedFindings.overallRiskLevel);
  }

  // Add individual red flag risk levels
  if (redFlagResults) {
    Object.values(redFlagResults).forEach((redFlag: any) => {
      if (redFlag?.riskLevel) {
        riskFactors.push(redFlag.riskLevel);
      } else if (redFlag?.severity) {
        riskFactors.push(redFlag.severity);
      } else if (redFlag?.pepsSeverity) {
        riskFactors.push(redFlag.pepsSeverity);
      }
    });
  }

  // Add comparison data risk
  const discrepancy =
    comparisonData?.totalComparison?.netSequestrationDiscrepancy?.percentage ||
    0;
  if (Math.abs(discrepancy) > 50) {
    riskFactors.push("CRITICAL");
  } else if (Math.abs(discrepancy) > 30) {
    riskFactors.push("HIGH");
  } else if (Math.abs(discrepancy) > 15) {
    riskFactors.push("MEDIUM");
  }

  // Determine highest risk level
  if (riskFactors.includes("CRITICAL")) return "CRITICAL";
  if (riskFactors.includes("HIGH")) return "HIGH";
  if (riskFactors.includes("MEDIUM")) return "MEDIUM";
  return "LOW";
}

/**
 * Determine red flag risk level
 */
function determineRedFlagRiskLevel(
  redFlagResults: any,
): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  if (!redFlagResults) return "LOW";

  const redFlagRisks: string[] = [];

  // Check integrated findings first
  if (redFlagResults.integratedFindings?.overallRiskLevel) {
    redFlagRisks.push(redFlagResults.integratedFindings.overallRiskLevel);
  }

  // Check individual red flags
  Object.values(redFlagResults).forEach((redFlag: any) => {
    if (redFlag?.riskLevel) {
      redFlagRisks.push(redFlag.riskLevel);
    } else if (redFlag?.severity) {
      redFlagRisks.push(redFlag.severity);
    } else if (redFlag?.pepsSeverity) {
      redFlagRisks.push(redFlag.pepsSeverity);
    }
  });

  if (redFlagRisks.includes("CRITICAL")) return "CRITICAL";
  if (redFlagRisks.includes("HIGH")) return "HIGH";
  if (redFlagRisks.includes("MEDIUM")) return "MEDIUM";
  return "LOW";
}

/**
 * Generate red flag summary
 */
function generateRedFlagSummary(redFlagResults: any): any {
  if (!redFlagResults) return null;

  return {
    totalAnalyses: Object.values(redFlagResults).filter(Boolean).length,
    overallRiskLevel: determineRedFlagRiskLevel(redFlagResults),
    availableAnalyses: {
      environmentalRedFlag1: !!redFlagResults.environmentalRedFlag1,
      environmentalRedFlag2: !!redFlagResults.environmentalRedFlag2,
      financialRedFlag1: !!redFlagResults.financialRedFlag1,
      financialRedFlag2: !!redFlagResults.financialRedFlag2,
      integratedFindings: !!redFlagResults.integratedFindings,
      anomalyDetection: !!redFlagResults.anomalyDetection,
    },
  };
}

/**
 * Generate standard critical findings (fallback)
 */
function generateStandardCriticalFindings(
  carbonData: any,
  lcamData: any,
  comparisonData?: any,
): string {
  const findings = [];

  if (
    comparisonData?.totalComparison?.netSequestrationDiscrepancy?.percentage
  ) {
    const discrepancy = Math.abs(
      comparisonData.totalComparison.netSequestrationDiscrepancy.percentage,
    );
    if (discrepancy > 30) {
      findings.push(
        `• **Discrepancy Signifikan:** ${discrepancy.toFixed(1)}% perbedaan antara LCAM dan Carbon Sensing AI`,
      );
    }
  }

  const verificationBody =
    lcamData.extractedData?.lembaga_verifikasi?.identitas_lembaga?.nama_lembaga;
  if (!verificationBody || verificationBody.includes("Not specified")) {
    findings.push(
      "• **Verification Gap:** Identitas lembaga verifikasi tidak jelas",
    );
  }

  const lcamPeriods =
    lcamData.extractedData?.penilaian_lcam?.ringkasan_kuantifikasi
      ?.periode_laporan?.length || 0;
  const carbonPeriods = carbonData.timeSeriesData?.length || 0;
  if (lcamPeriods < carbonPeriods) {
    findings.push(
      "• **Data Incompleteness:** Data LCAM tidak mencakup semua periode analisis",
    );
  }

  return findings.length > 0
    ? findings.join("\n")
    : "No critical technical issues identified.";
}

/**
 * Enhanced conclusion with red flag integration
 */
function generateEnhancedConclusion(
  carbonData: any,
  lcamData: any,
  comparisonData?: any,
  anomalyResult?: any,
  redFlagResults?: any,
): string {
  const sections = [];

  sections.push("**KESIMPULAN ANALISIS KOMPREHENSIF:**");

  const projectTitle =
    lcamData.extractedData?.informasi_umum?.judul_kegiatan || "Project";
  sections.push(`**PROJECT:** ${projectTitle}`);

  // Overall risk assessment
  const overallRisk = calculateComprehensiveRiskLevel(
    carbonData,
    lcamData,
    comparisonData,
    anomalyResult,
    redFlagResults,
  );
  sections.push(`**OVERALL RISK LEVEL:** ${overallRisk}`);

  if (anomalyResult) {
    sections.push(`**AI ANOMALY RISK:** ${anomalyResult.riskLevel}`);
    sections.push(
      `**INVESTIGATION PRIORITY:** ${anomalyResult.investigationPriority}`,
    );
    sections.push(
      `**ECONOMIC IMPACT:** Rp ${anomalyResult.economicImpact.toLocaleString()}`,
    );
  }

  if (redFlagResults) {
    const redFlagRisk = determineRedFlagRiskLevel(redFlagResults);
    const redFlagCount = Object.values(redFlagResults).filter(Boolean).length;
    sections.push(`**RED FLAG RISK LEVEL:** ${redFlagRisk}`);
    sections.push(`**RED FLAG ANALYSES AVAILABLE:** ${redFlagCount}`);
  }

  sections.push("");

  // Key metrics
  sections.push("**KEY METRICS:**");
  sections.push(
    `- Area: ${carbonData.measurementArea?.toFixed(2) || "Unknown"} hektar`,
  );

  if (comparisonData?.summaryStatistics?.averageDiscrepancyPercentage) {
    sections.push(
      `- Discrepancy: ${Math.abs(comparisonData.summaryStatistics.averageDiscrepancyPercentage).toFixed(1)}%`,
    );
  }

  const dataReliability =
    comparisonData?.qualityAssessment?.dataReliability || "unknown";
  sections.push(`- Data reliability: ${dataReliability}`);
  sections.push("");

  // Overall assessment based on risk level
  sections.push("**OVERALL ASSESSMENT:**");
  switch (overallRisk) {
    case "CRITICAL":
      sections.push(
        "🚨 **CRITICAL RISK**: Project menunjukkan indikasi sangat kuat fraud dan anomali. Tindakan mendesak diperlukan.",
      );
      sections.push("   - Multiple red flags terdeteksi");
      sections.push("   - Anomali signifikan dalam data");
      sections.push("   - Potensi kerugian finansial besar");
      break;
    case "HIGH":
      sections.push(
        "⚠️ **HIGH RISK**: Project menunjukkan indikasi kuat fraud. Investigasi prioritas diperlukan.",
      );
      sections.push("   - Beberapa red flags teridentifikasi");
      sections.push("   - Discrepancy data signifikan");
      sections.push("   - Enhanced monitoring diperlukan");
      break;
    case "MEDIUM":
      sections.push(
        "📋 **MEDIUM RISK**: Project menunjukkan beberapa red flags. Enhanced monitoring direkomendasikan.",
      );
      sections.push("   - Red flags tertentu memerlukan perhatian");
      sections.push("   - Data quality perlu diperbaiki");
      sections.push("   - Monitoring berkelanjutan diperlukan");
      break;
    case "LOW":
      sections.push(
        "✅ **LOW RISK**: Project menunjukkan risiko rendah berdasarkan analisis komprehensif.",
      );
      sections.push("   - Minimal red flags terdeteksi");
      sections.push("   - Data consistency acceptable");
      sections.push("   - Standard monitoring adequat");
      break;
  }

  return sections.join("\n");
}

/**
 * Enhanced recommendations with red flag integration
 */
function generateEnhancedRecommendations(
  anomalyResult?: any,
  redFlagResults?: any,
): string {
  const sections = [];

  sections.push("**REKOMENDASI TINDAKAN KOMPREHENSIF:**");

  // Determine priority based on all analyses
  const overallRisk = determineOverallRisk(anomalyResult, redFlagResults, null);
  const redFlagRisk = determineRedFlagRiskLevel(redFlagResults);

  sections.push(
    `**PRIORITAS KESELURUHAN:** ${anomalyResult?.investigationPriority || mapRiskToPriority(overallRisk)}`,
  );
  sections.push(`**RED FLAG PRIORITY:** ${mapRiskToPriority(redFlagRisk)}`);
  sections.push("");

  // Immediate actions based on risk level
  sections.push("**1. TINDAKAN SEGERA:**");
  if (overallRisk === "CRITICAL" || redFlagRisk === "CRITICAL") {
    sections.push(
      "   🚨 **IMMEDIATE FREEZE:** Suspend semua transaksi carbon credits",
    );
    sections.push(
      "   🚨 **FIELD VERIFICATION:** Deploy independent verification team",
    );
    sections.push(
      "   🚨 **FINANCIAL FREEZE:** Request freeze account terkait project",
    );
    sections.push(
      "   🚨 **ALERT COORDINATION:** Notify relevant law enforcement",
    );
  } else if (overallRisk === "HIGH" || redFlagRisk === "HIGH") {
    sections.push(
      "   ⚠️ **ENHANCED MONITORING:** Implement heightened monitoring",
    );
    sections.push(
      "   ⚠️ **VERIFICATION REQUEST:** Additional technical verification",
    );
    sections.push(
      "   ⚠️ **STAKEHOLDER REVIEW:** Enhanced due diligence on stakeholders",
    );
  } else {
    sections.push(
      "   ✅ **STANDARD MONITORING:** Continue regular monitoring protocols",
    );
    sections.push(
      "   ✅ **PERIODIC REVIEW:** Schedule regular compliance reviews",
    );
  }
  sections.push("");

  // Red flag specific actions
  if (redFlagResults && Object.values(redFlagResults).some(Boolean)) {
    sections.push("**2. RED FLAG SPECIFIC ACTIONS:**");

    if (redFlagResults.environmentalRedFlag1) {
      sections.push(
        "   🌿 **Environmental Red Flag 1:** Verify carbon activity methodology",
      );
    }
    if (redFlagResults.environmentalRedFlag2) {
      sections.push(
        "   🏞️ **Environmental Red Flag 2:** Investigate land dispute claims",
      );
    }
    if (redFlagResults.financialRedFlag1) {
      sections.push("   💰 **Financial Red Flag 1:** Enhanced PEPs screening");
    }
    if (redFlagResults.financialRedFlag2) {
      sections.push("   📊 **Financial Red Flag 2:** Monitor trading patterns");
    }
    sections.push("");
  }

  // AI anomaly specific actions
  if (anomalyResult?.recommendedActions?.length > 0) {
    sections.push("**3. AI ANOMALY ACTIONS:**");
    anomalyResult.recommendedActions.forEach((action: string) => {
      sections.push(`   🤖 ${action}`);
    });
    sections.push("");
  }

  // Investigative actions
  sections.push("**4. INVESTIGASI MENDALAM:**");
  if (overallRisk === "CRITICAL") {
    sections.push("   📋 **Full Investigation:** Complete forensic analysis");
    sections.push(
      "   📋 **Cross-Border Coordination:** International FIU cooperation",
    );
    sections.push("   📋 **Asset Investigation:** Trace beneficial ownership");
  } else if (overallRisk === "HIGH") {
    sections.push(
      "   📋 **Enhanced Due Diligence:** Deep dive stakeholder analysis",
    );
    sections.push("   📋 **Transaction Analysis:** Follow money trail");
    sections.push("   📋 **Pattern Analysis:** Identify systematic issues");
  } else {
    sections.push(
      "   📋 **Standard Due Diligence:** Regular compliance checks",
    );
  }
  sections.push("");

  // Preventive measures
  sections.push("**5. TINDAKAN PREVENTIF:**");
  sections.push(
    "   🛡️ **REGULATORY ENHANCEMENT:** Strengthen verification requirements",
  );
  sections.push(
    "   🛡️ **TECHNOLOGY INTEGRATION:** Mandatory AI-powered monitoring",
  );
  sections.push(
    "   🛡️ **TRANSPARENCY REQUIREMENTS:** Real-time reporting mechanisms",
  );
  sections.push(
    "   🛡️ **RED FLAG AUTOMATION:** Implement automated red flag detection",
  );
  sections.push("");

  // Timeline
  const timeline = determineTimeline(
    overallRisk,
    redFlagRisk,
    anomalyResult?.investigationPriority,
  );
  sections.push(`**TIMELINE:** ${timeline}`);

  if (anomalyResult?.economicImpact) {
    sections.push(
      `**ESTIMATED ECONOMIC IMPACT:** Rp ${anomalyResult.economicImpact.toLocaleString()}`,
    );
  }

  return sections.join("\n");
}

/**
 * Helper functions
 */
function mapRiskToPriority(risk: string): string {
  switch (risk) {
    case "CRITICAL":
      return "URGENT";
    case "HIGH":
      return "HIGH";
    case "MEDIUM":
      return "MEDIUM";
    case "LOW":
      return "LOW";
    default:
      return "MEDIUM";
  }
}

function determineTimeline(
  overallRisk: string,
  redFlagRisk: string,
  anomalyPriority?: string,
): string {
  if (
    overallRisk === "CRITICAL" ||
    redFlagRisk === "CRITICAL" ||
    anomalyPriority === "URGENT"
  ) {
    return "🚨 URGENT - 24 hours";
  } else if (
    overallRisk === "HIGH" ||
    redFlagRisk === "HIGH" ||
    anomalyPriority === "HIGH"
  ) {
    return "⚠️ Priority - 72 hours";
  } else if (overallRisk === "MEDIUM" || redFlagRisk === "MEDIUM") {
    return "📅 Standard - 1 week";
  } else {
    return "📅 Routine - 1 month";
  }
}

/**
 * Keep existing helper functions for backward compatibility
 */
function generatePotentialCarbonCredits(
  carbonData: any,
  comparisonData?: any,
): string {
  if (comparisonData?.recommendations?.netSequestrationValues) {
    const recommended = comparisonData.recommendations.netSequestrationValues;
    return `**Estimasi Potensi Kredit Karbon:**
Conservative: ${recommended.conservative.toLocaleString()} ton CO2e
Moderate: ${recommended.moderate.toLocaleString()} ton CO2e  
Optimistic: ${recommended.optimistic.toLocaleString()} ton CO2e`;
  }

  const totalNetSequestration =
    carbonData.summaryMetrics?.totalCarbonStockNetSequestration || 0;
  return `**Estimasi Potensi Kredit Karbon:** ${totalNetSequestration.toLocaleString()} ton CO2e`;
}

function generateCarbonPricingValuation(
  carbonData: any,
  comparisonData?: any,
): string {
  let totalCredits = 0;

  if (comparisonData?.recommendations?.marketableCreditsValues) {
    const marketableCredits =
      comparisonData.recommendations.marketableCreditsValues;
    return `**Valuasi Ekonomi Kredit Karbon:**
Minimum: ${marketableCredits.conservative.toLocaleString()} IDR
Moderate: ${marketableCredits.moderate.toLocaleString()} IDR  
Maximum: ${marketableCredits.optimistic.toLocaleString()} IDR`;
  }

  totalCredits =
    carbonData.summaryMetrics?.totalCarbonStockNetSequestration || 0;
  const conservativeCredits = totalCredits * 0.8;

  return `**Valuasi Ekonomi Kredit Karbon:**
IDR 30,000/ton: ${(conservativeCredits * 30000).toLocaleString()} IDR
IDR 50,000/ton: ${(conservativeCredits * 50000).toLocaleString()} IDR
IDR 70,000/ton: ${(conservativeCredits * 70000).toLocaleString()} IDR`;
}

function generateEnhancedAnomalySection(anomalyResult: any): string {
  return `**AI-POWERED ANOMALY DETECTION:**

**Risk Level: ${anomalyResult.riskLevel}**
**Investigation Priority: ${anomalyResult.investigationPriority}**
**Economic Impact: Rp ${anomalyResult.economicImpact.toLocaleString()}**

**Key Findings:**
${anomalyResult.keyFindings.map((finding: string) => `• ${finding}`).join("\n")}

**Detailed Analysis:**
${anomalyResult.anomalyNarrative}

${
  anomalyResult.redFlagIntegration
    ? `
**Red Flag Integration:**
Environmental Concerns: ${anomalyResult.redFlagIntegration.environmentalConcerns?.join(", ") || "None"}
Financial Concerns: ${anomalyResult.redFlagIntegration.financialConcerns?.join(", ") || "None"}
Cross-Cutting Issues: ${anomalyResult.redFlagIntegration.crossCuttingIssues?.join(", ") || "None"}
Overall Red Flag Impact: ${anomalyResult.redFlagIntegration.overallRedFlagImpact}
`
    : ""
}

**Focus Area:** ${anomalyResult.focusArea}
**Generated:** ${new Date(anomalyResult.generatedAt).toLocaleString("id-ID")}`;
}

// Keep existing fallback functions for backward compatibility
function generateAnomalyDetection(
  carbonData: any,
  lcamData: any,
  comparisonData?: any,
): string {
  const anomalies = [];

  if (comparisonData?.summaryStatistics?.averageDiscrepancyPercentage > 25) {
    anomalies.push(
      "🚨 High Discrepancy: Perbedaan LCAM vs Carbon Sensing AI > 25%",
    );
  }

  const avgGrowth = carbonData.summaryMetrics?.averageAnnualGrowth || 0;
  if (avgGrowth > 50000) {
    anomalies.push(
      "🚨 Unrealistic Growth Rate: Pertumbuhan tahunan tidak wajar",
    );
  }

  if (carbonData.baselineStats?.totalCarbon < 1000) {
    anomalies.push("⚠️ Low Baseline: Baseline carbon stock sangat rendah");
  }

  if (comparisonData?.qualityAssessment?.dataReliability === "low") {
    anomalies.push("⚠️ Data Quality Issue: Reliabilitas data rendah");
  }

  if (anomalies.length === 0) {
    return "✅ No Critical Anomalies Detected";
  }

  return `Anomali Terdeteksi:\n${anomalies.join("\n")}`;
}

/**
 * Determine overall risk from all analyses
 */
function determineOverallRisk(
  anomalyResult?: any,
  redFlagResults?: any,
  comparisonData?: any,
): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
  const riskLevels: string[] = [];

  // Add anomaly risk level
  if (anomalyResult?.riskLevel) {
    riskLevels.push(anomalyResult.riskLevel);
  }

  // Add integrated red flag risk level
  if (redFlagResults?.integratedFindings?.overallRiskLevel) {
    riskLevels.push(redFlagResults.integratedFindings.overallRiskLevel);
  }

  // Add individual red flag risk levels
  if (redFlagResults) {
    Object.values(redFlagResults).forEach((redFlag: any) => {
      if (redFlag?.riskLevel) {
        riskLevels.push(redFlag.riskLevel);
      } else if (redFlag?.severity) {
        riskLevels.push(redFlag.severity);
      } else if (redFlag?.pepsSeverity) {
        riskLevels.push(redFlag.pepsSeverity);
      }
    });
  }

  // Add comparison data risk
  const discrepancy =
    comparisonData?.totalComparison?.netSequestrationDiscrepancy?.percentage ||
    0;
  if (Math.abs(discrepancy) > 50) {
    riskLevels.push("CRITICAL");
  } else if (Math.abs(discrepancy) > 30) {
    riskLevels.push("HIGH");
  } else if (Math.abs(discrepancy) > 15) {
    riskLevels.push("MEDIUM");
  }

  // Determine highest risk level
  if (riskLevels.includes("CRITICAL")) return "CRITICAL";
  if (riskLevels.includes("HIGH")) return "HIGH";
  if (riskLevels.includes("MEDIUM")) return "MEDIUM";
  return "LOW";
}

// Additional helper functions for new sections (implementation needed)
function generatePersonnelSection(
  type: "owner" | "technical" | "verification",
  extractedData: any,
): string {
  const personnel = [];

  if (type === "owner") {
    const owner = extractedData?.informasi_umum?.pemilik_kegiatan;
    if (owner) {
      personnel.push(`**PROJECT OWNER ANALYSIS:**`);
      personnel.push(`- Name: ${owner.project_owner || "Not specified"}`);
      personnel.push(
        `- Technical Partner: ${owner.technical_partner || "Not specified"}`,
      );
      personnel.push(
        `- Community Partner: ${owner.community_partner || "Not specified"}`,
      );

      // Add risk assessment for owner
      if (!owner.project_owner || owner.project_owner === "Not specified") {
        personnel.push(
          `⚠️ **Risk:** Project owner tidak teridentifikasi dengan jelas`,
        );
      }
    }
  } else if (type === "verification") {
    const verification = extractedData?.lembaga_verifikasi?.identitas_lembaga;
    if (verification) {
      personnel.push(`**VERIFICATION BODY ANALYSIS:**`);
      personnel.push(
        `- Institution: ${verification.nama_lembaga || "Not specified"}`,
      );
      personnel.push(`- Address: ${verification.alamat || "Not specified"}`);
      personnel.push(`- Contact: ${verification.kontak || "Not specified"}`);

      if (
        !verification.nama_lembaga ||
        verification.nama_lembaga === "Not specified"
      ) {
        personnel.push(`🚨 **Risk:** Lembaga verifikasi tidak teridentifikasi`);
      }
    }
  }

  return personnel.length > 1
    ? personnel.join("\n")
    : `${type} analysis - No detailed information available`;
}

function generateActivityAnalysis(carbonData: any, extractedData: any): string {
  const activities = [];

  activities.push("**NO ACTIVITY ANALYSIS:**");

  // Check for suspicious activity patterns
  const lulcData = carbonData.lulcTableData || [];
  const lowActivityYears = lulcData.filter(
    (item: any) =>
      item.totalCarbonChange && Math.abs(item.totalCarbonChange) < 100,
  ).length;

  if (lowActivityYears > 0) {
    activities.push(
      `⚠️ **Suspicious Pattern:** ${lowActivityYears} tahun dengan aktivitas karbon minimal`,
    );
  }

  // Check methodology consistency
  const methodology = extractedData?.metodologi_perhitungan_lcam;
  if (!methodology || Object.keys(methodology || {}).length === 0) {
    activities.push(`🚨 **Risk:** Metodologi perhitungan tidak jelas`);
  }

  if (activities.length === 1) {
    activities.push("✅ No suspicious activity patterns detected");
  }

  return activities.join("\n");
}

function generateForestOverlapAnalysis(
  carbonData: any,
  extractedData: any,
): string {
  const overlap = [];

  overlap.push("**FOREST PROTECTED AREA OVERLAP ANALYSIS:**");

  // Check location against protected areas (simplified analysis)
  const location = extractedData?.informasi_umum?.alamat_dan_lokasi;
  if (location?.lokasi_tapak) {
    overlap.push(`- Project Location: ${location.lokasi_tapak}`);
    overlap.push(
      `- Coordinates: ${location.latitude || "Unknown"}, ${location.longitude || "Unknown"}`,
    );

    // Simple heuristic for protected area overlap (would need actual spatial analysis)
    if (
      location.lokasi_tapak.toLowerCase().includes("hutan") ||
      location.lokasi_tapak.toLowerCase().includes("lindung") ||
      location.lokasi_tapak.toLowerCase().includes("konservasi")
    ) {
      overlap.push(
        `⚠️ **Potential Overlap:** Lokasi mungkin overlap dengan kawasan lindung`,
      );
    }
  }

  // Check project area size vs typical protected area projects
  const totalArea = parseFloat(
    extractedData?.ringkasan_eksekutif?.total_area || "0",
  );
  if (totalArea > 10000) {
    overlap.push(
      `⚠️ **Large Area:** Project area ${totalArea} hektar - requires enhanced verification`,
    );
  }

  if (overlap.length === 1) {
    overlap.push("✅ No obvious protected area conflicts detected");
  }

  return overlap.join("\n");
}

function generatePoliticalActorAnalysis(extractedData: any): string {
  const political = [];

  political.push("**POLITICAL ACTOR ANALYSIS:**");

  // Check for political connections in project ownership
  const owner =
    extractedData?.informasi_umum?.pemilik_kegiatan?.project_owner || "";
  const technicalPartner =
    extractedData?.informasi_umum?.pemilik_kegiatan?.technical_partner || "";

  // Simple heuristic for political connections (would need actual PEPs database)
  const politicalKeywords = [
    "dinas",
    "pemerintah",
    "bupati",
    "walikota",
    "gubernur",
    "menteri",
    "dprd",
    "dpr",
  ];
  const foundKeywords = politicalKeywords.filter(
    (keyword) =>
      owner.toLowerCase().includes(keyword) ||
      technicalPartner.toLowerCase().includes(keyword),
  );

  if (foundKeywords.length > 0) {
    political.push(
      `⚠️ **Political Connection Detected:** Keywords found - ${foundKeywords.join(", ")}`,
    );
    political.push(
      `🚨 **Enhanced Due Diligence Required:** Political exposure detected`,
    );
  }

  // Check verification body for political connections
  const verificationBody =
    extractedData?.lembaga_verifikasi?.identitas_lembaga?.nama_lembaga || "";
  const verificationPolitical = politicalKeywords.filter((keyword) =>
    verificationBody.toLowerCase().includes(keyword),
  );

  if (verificationPolitical.length > 0) {
    political.push(
      `⚠️ **Verification Body Political Link:** ${verificationPolitical.join(", ")}`,
    );
  }

  if (political.length === 1) {
    political.push("✅ No obvious political connections detected");
  }

  return political.join("\n");
}

function generateTransactionAnalysis(extractedData: any): string {
  const transaction = [];

  transaction.push("**INDIVIDUAL TRANSACTION ANALYSIS:**");

  // Analyze potential transaction patterns from LCAM data
  const lcamAssessment = extractedData?.penilaian_lcam?.ringkasan_kuantifikasi;
  if (lcamAssessment) {
    transaction.push(
      `- Assessment Periods: ${lcamAssessment.periode_laporan?.length || 0}`,
    );

    // Check for unusual transaction timing
    if (lcamAssessment.periode_laporan?.length === 1) {
      transaction.push(
        `⚠️ **Single Period Risk:** Only one assessment period - unusual for carbon projects`,
      );
    }

    // Check for round numbers (potential manipulation indicator)
    const carbonValues = Object.values(lcamAssessment).filter(
      (val) => typeof val === "number" && val % 1000 === 0 && val > 0,
    );

    if (carbonValues.length > 2) {
      transaction.push(
        `⚠️ **Round Number Pattern:** Multiple round carbon values detected - potential manipulation`,
      );
    }
  }

  // Check project timeline for transaction irregularities
  const projectPeriod = extractedData?.ringkasan_eksekutif?.periode_penaatan;
  const reportingPeriod =
    extractedData?.ringkasan_eksekutif?.periode_laporan_pemantauan;

  if (projectPeriod && reportingPeriod && projectPeriod === reportingPeriod) {
    transaction.push(
      `⚠️ **Timeline Concern:** Project and reporting periods identical - verify timing`,
    );
  }

  if (transaction.length === 1) {
    transaction.push("✅ No suspicious transaction patterns detected");
  }

  return transaction.join("\n");
}
