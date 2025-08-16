import "maplibre-gl/dist/maplibre-gl.css";

import { cn } from "@/utils/classnames";
import { MapContext } from "./maps-context";
import { type FC, useRef, useEffect, useContext } from "react";
import maplibregl, { type MapOptions, type FlyToOptions } from "maplibre-gl";

export type ViewOptions = Pick<
  FlyToOptions,
  "center" | "bearing" | "pitch" | "zoom"
>;

export type MapInstance = Omit<
  MapOptions,
  "style" | "container" | keyof ViewOptions
> & {
  /**
   * classNames for map instances components
   */
  className?: string;

  /**
   * additional style for map instance
   */
  style?: React.CSSProperties;

  /**
   * map style, see mapbox style spec
   */
  mapStyle?: MapOptions["style"];

  /**
   * handle map view
   */
  mapView?: ViewOptions;
};

/**
 * render maps intance inside provider
 */
export const MapInstance: FC<MapInstance> = ({
  style,
  mapView,
  mapStyle,
  className,
  ...props
}) => {
  const ctx = useContext(MapContext);

  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewOptions: ViewOptions = mapView
      ? Object.entries(mapView).reduce(
          (acc, [key, value]) => {
            if (value !== undefined) acc[key as keyof typeof acc] = value;

            return acc;
          },
          {} as Record<string, unknown>,
        )
      : {};

    const map = new maplibregl.Map({
      style: mapStyle,
      container: mapContainer.current!,
      ...viewOptions,
      ...props,
    });

    ctx?.setMap(map);

    return () => map.remove();
  }, []);

  return (
    <div
      style={style}
      ref={mapContainer!}
      className={cn("absolute size-full", className)}
    />
  );
};
