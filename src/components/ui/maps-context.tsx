import type { Map as MapLibre } from "maplibre-gl";
import {
  type FC,
  useState,
  useContext,
  createContext,
  type PropsWithChildren,
} from "react";

interface MapContextValue {
  map: MapLibre | undefined;

  setMap: (map: MapLibre) => void;
}

export const MapContext = createContext<MapContextValue | undefined>(undefined);

/**
 * wherever you want to render maps, you need to initialize this first
 */
export const MapProvider: FC<PropsWithChildren> = ({ children }) => {
  const [map, setMap] = useState<MapLibre>();

  return (
    <MapContext.Provider value={{ map, setMap }}>
      {children}
    </MapContext.Provider>
  );
};

/**
 * use this to access map instance
 */
export const useMap = () => {
  const ctx = useContext(MapContext);

  if (!ctx) throw new Error("you do it wrong");

  return ctx.map!;
};
