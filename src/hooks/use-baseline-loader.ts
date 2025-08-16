// hooks/useBaselineLoader.ts - New hook for loading baseline data
import { useEffect, useState } from "react";
import { loadTiffFromPublic } from "./tiff-loader";

interface UseBaselineLoaderProps {
  currentYear: string;
  availableYears: string[];
}

export const useBaselineLoader = ({
  currentYear,
  availableYears,
}: UseBaselineLoaderProps) => {
  const [baselineData, setBaselineData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBaseline = async () => {
      const yearNum = parseInt(currentYear);
      const baselineYear = (yearNum - 1).toString();

      // Check if baseline year is available
      if (!availableYears.includes(baselineYear)) {
        setBaselineData({});
        setError(`Baseline year ${baselineYear} not available`);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const baselineFilename = `${baselineYear}_Predicted_LULC.tif`;
        const baselineTiffData = await loadTiffFromPublic(baselineFilename);

        // Convert TIFF data to baseline mapping
        const baseline: Record<string, number> = {};

        if (baselineTiffData.data) {
          // Calculate class distributions
          const classCounts: Record<number, number> = {};
          const totalPixels = baselineTiffData.data.length;

          // Count pixels for each class
          baselineTiffData.data.forEach((value) => {
            if (value >= 0 && value <= 17) {
              classCounts[value] = (classCounts[value] || 0) + 1;
            }
          });

          // Convert to proportions
          Object.entries(classCounts).forEach(([classValue, count]) => {
            baseline[classValue] = count / totalPixels;
          });
        }

        setBaselineData(baseline);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load baseline";
        setError(errorMessage);
        setBaselineData({});
      } finally {
        setLoading(false);
      }
    };

    loadBaseline();
  }, [currentYear, availableYears]);

  return { baselineData, loading, error };
};
