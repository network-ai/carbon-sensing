// components/CarbonAnalysisMapSystem.tsx
import { useGeoJsonLoader } from "@/hooks/use-geojson-layer";
import type { LayerType } from "@/utils/carbon-mappings";
import type React from "react";
import { useEffect, useState } from "react";
import { loadTiffFromPublic } from "../../hooks/tiff-loader";
import { AdminBoundaryLayer } from "./admin-boundary-layer";
import { CarbonLayerSelector } from "./carbon-layer-selectors";
import { CarbonStatistics } from "./carbon-statistics";
import { CarbonTiffLayer } from "./carbon-tiff-layers";
import { DynamicLegend } from "./dynamic-legend";
import { LayerControls } from "./layer-controls";

const availableYears = ["2020", "2021", "2022", "2023", "2024"];

// Updated CarbonAnalysisMapSystem with dynamic baseline loading
export const CarbonAnalysisMapSystem: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedLayer, setSelectedLayer] = useState<LayerType>("carbon_stock");
  const [opacity, setOpacity] = useState(0.8);
  const [visible, setVisible] = useState(true);
  const [baselineData, setBaselineData] = useState<Record<string, number>>({});
  const [currentTiffData, setCurrentTiffData] = useState<any>(null);
  const [loadingBaseline, setLoadingBaseline] = useState(false);
  const [baselineError, setBaselineError] = useState<string | null>(null);

  // Function to load baseline data from previous year
  const loadBaselineData = async (currentYear: string) => {
    const yearNum = parseInt(currentYear);
    const baselineYear = (yearNum - 1).toString();

    // Don't load baseline for the first available year
    if (yearNum <= parseInt(availableYears[0])) {
      setBaselineData({});
      return;
    }

    setLoadingBaseline(true);
    setBaselineError(null);

    try {
      console.log(`Loading baseline data from year ${baselineYear}`);

      // Load the TIFF file for the baseline year
      const baselineFilename = `${baselineYear}_Predicted_LULC.tif`;
      const baselineTiffData = await loadTiffFromPublic(baselineFilename);

      // Convert TIFF pixel data to baseline mapping
      const baseline: Record<string, number> = {};

      // Process the TIFF data to create baseline mapping
      if (baselineTiffData.data) {
        const pixelValues = Array.from(new Set(baselineTiffData.data));

        // Create baseline mapping based on actual pixel distribution
        pixelValues.forEach((value) => {
          if (value >= 0 && value <= 17) {
            // Valid LULC classes
            // Count occurrences of each value to determine baseline proportions
            const totalPixels = baselineTiffData.data.length;
            const valueCount = baselineTiffData.data.filter(
              (v) => v === value,
            ).length;
            baseline[value.toString()] = valueCount / totalPixels;
          }
        });
      }

      console.log(`Loaded baseline data for ${baselineYear}:`, baseline);
      setBaselineData(baseline);
    } catch (error) {
      console.error(`Error loading baseline data for ${baselineYear}:`, error);
      setBaselineError(`Failed to load baseline data from ${baselineYear}`);

      // Fallback to empty baseline data
      setBaselineData({});
    } finally {
      setLoadingBaseline(false);
    }
  };

  // Load baseline data when selected year changes
  useEffect(() => {
    loadBaselineData(selectedYear);
  }, [selectedYear]);

  const generateLayerId = (year: string, layerType: LayerType) => {
    return `carbon-${layerType}-${year}`;
  };

  const generateFilename = (year: string) => {
    return `${year}_Predicted_LULC.tif`;
  };

  const handleCompareYears = (year1: string, year2: string) => {
    console.log(`Comparing ${year1} vs ${year2}`);
    // Implement comparison logic
  };

  const handleExportData = (layerType: LayerType, year: string) => {
    console.log(`Exporting ${layerType} data for ${year}`);
    // Implement export logic
  };

  // Show baseline loading indicator
  const isLoadingData = loadingBaseline;

  // Admin boundary state
  const [adminVisible, setAdminVisible] = useState(true);
  const [adminStrokeWidth, setAdminStrokeWidth] = useState(3);
  const [adminFillOpacity, setAdminFillOpacity] = useState(0.1);
  const [adminLabelSize, setAdminLabelSize] = useState(14);
  const {
    data: riauAdminData,
    loading: adminDataLoading,
    error: adminDataError,
  } = useGeoJsonLoader("riau_adm2.geojson");
  return (
    <>
      {/* Loading indicator for baseline data */}
      {isLoadingData && (
        <div className="absolute top-16 left-4 bg-blue-100 border border-blue-400 text-blue-700 p-3 rounded shadow-lg z-20">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm">
              Loading baseline data from {parseInt(selectedYear) - 1}...
            </span>
          </div>
        </div>
      )}

      {/* Baseline error indicator */}
      {baselineError && (
        <div className="absolute top-16 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 p-3 rounded shadow-lg z-20">
          <div className="text-sm">
            <strong>Warning:</strong> {baselineError}
            <br />
            <span className="text-xs">
              Using current year data as baseline.
            </span>
          </div>
        </div>
      )}

      {riauAdminData && (
        <AdminBoundaryLayer
          id="riau-admin-boundaries"
          geojsonData={riauAdminData}
          visible={adminVisible}
          strokeColor="black" // Orange color for visibility
          strokeWidth={adminStrokeWidth}
          fillColor="white"
          fillOpacity={adminFillOpacity}
          labelField="ADM2_EN"
          labelSize={adminLabelSize}
          labelColor="#2D3748"
          onLoad={() => console.log("Admin boundaries loaded successfully")}
          onError={(error) => console.error("Admin boundary error:", error)}
        />
      )}
      {/* Render active layer */}
      <CarbonTiffLayer
        key={`${selectedYear}-${selectedLayer}-${Object.keys(baselineData).length}`}
        id={generateLayerId(selectedYear, selectedLayer)}
        filename={generateFilename(selectedYear)}
        year={selectedYear}
        layerType={selectedLayer}
        baselineData={baselineData}
        visible={visible}
        opacity={opacity}
        onLoad={(data) => {
          console.log(`Loaded ${selectedLayer} for ${selectedYear}:`, data);
          setCurrentTiffData(data);
        }}
        onError={(error) =>
          console.error(
            `Error loading ${selectedLayer} for ${selectedYear}:`,
            error,
          )
        }
      />

      {/* Layer Selector */}
      <CarbonLayerSelector
        years={availableYears}
        selectedYear={selectedYear}
        selectedLayer={selectedLayer}
        onYearChange={setSelectedYear}
        onLayerChange={setSelectedLayer}
        position="top-left"
      />

      {/* Layer Controls */}
      <LayerControls
        opacity={opacity}
        onOpacityChange={setOpacity}
        visible={visible}
        onVisibilityChange={setVisible}
        position="top-center"
        // Admin boundaries props
        adminVisible={adminVisible}
        onAdminVisibilityChange={setAdminVisible}
        adminStrokeWidth={adminStrokeWidth}
        onAdminStrokeWidthChange={setAdminStrokeWidth}
        adminFillOpacity={adminFillOpacity}
        onAdminFillOpacityChange={setAdminFillOpacity}
        adminLabelSize={adminLabelSize}
        onAdminLabelSizeChange={setAdminLabelSize}
        adminDataLoaded={!!riauAdminData && !adminDataLoading}
      />

      {/* Dynamic Legend */}
      <DynamicLegend
        layerType={selectedLayer}
        year={selectedYear}
        position="bottom-left"
      />

      {/* Statistics Panel */}
      <CarbonStatistics
        year={selectedYear}
        layerType={selectedLayer}
        tiffData={currentTiffData}
        position="bottom-center"
      />

      {/* Baseline Info Panel */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded shadow-lg z-10 max-w-xs">
        <div className="text-sm">
          <strong>Baseline Year:</strong> {parseInt(selectedYear) - 1}
          <br />
          <span className="text-xs text-gray-600">
            {Object.keys(baselineData).length > 0
              ? `Using ${Object.keys(baselineData).length} baseline classes`
              : "No baseline data available"}
          </span>
        </div>
      </div>
    </>
  );
};
