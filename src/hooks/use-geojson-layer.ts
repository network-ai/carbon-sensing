import { useEffect, useState } from "react";

// Hook to load GeoJSON from public folder
export const useGeoJsonLoader = (filename: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGeoJson = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`Loading GeoJSON: ${filename}`);
        const response = await fetch(`/${filename}`);

        if (!response.ok) {
          throw new Error(
            `Failed to load ${filename}: ${response.status} ${response.statusText}`,
          );
        }

        const geojsonData = await response.json();
        console.log(`Successfully loaded ${filename}:`, geojsonData);
        setData(geojsonData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : `Failed to load ${filename}`;
        setError(errorMessage);
        console.error(`Error loading GeoJSON ${filename}:`, err);
      } finally {
        setLoading(false);
      }
    };

    if (filename) {
      loadGeoJson();
    }
  }, [filename]);

  return { data, loading, error };
};
