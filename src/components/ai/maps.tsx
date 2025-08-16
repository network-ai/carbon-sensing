// Updated Maps.tsx
import { MapInstance } from "@/components/ui/maps-instance";
import { CarbonAnalysisMapSystem } from "../maps/carbon-analysis-map-system";
import { store } from "./store";

export const Maps = () => {
  // Get map state from store untuk determine visibility
  const map = store((s) => s.map);

  return (
    <div>
      <MapInstance
        attributionControl={false}
        mapStyle="https://api.maptiler.com/maps/hybrid/style.json?key=O7PAbzskDTxUmuyVGvJ0"
        className="absolute! top-0 left-0 z-5 size-full"
        mapView={{
          center: [101.7136, 0.2945], // Monas coordinates
          zoom: 12,
          pitch: 0,
          bearing: 0,
        }}
      />

      {/* Only render CarbonAnalysisMapSystem when map is visible (not full screen chat) */}
      {map && <CarbonAnalysisMapSystem />}
    </div>
  );
};
