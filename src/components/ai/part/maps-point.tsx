import { cn } from "@/utils/classnames";
import { store } from "@/components/ai/store";
import { MapPin, Loader2 } from "lucide-react";
import { type FC, useEffect, useRef } from "react";
import type { ToolPart } from "@/components/ai/part";
import { useMap } from "@/components/ui/maps-context";

export const MapsPoint: FC<{
  part: ToolPart<"data-maps-point">;
  className?: string;
}> = ({ part, className }) => {
  const initialState = useRef(part.data.state);

  const map = useMap();

  useEffect(() => {
    if (initialState.current === "in-progress") {
      if (part.data.state === "completed") {
        if (map) {
          store.getState().setMap(true);

          map.flyTo({
            center: [part.data.longitude, part.data.latitude],
            zoom: part.data.zoom || 12,
            bearing: part.data.bearing || 0,
            pitch: part.data.pitch || 0,
          });
        }
      }
    }
  }, [part.data.state]);

  if (part.data.state === "in-progress") {
    return (
      <div
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm p-4",
          className,
        )}
      >
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-muted-foreground">{part.data.name}</span>
        </div>
      </div>
    );
  }

  if (part.data.state === "failed") {
    return (
      <div
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm p-4",
          className,
        )}
      >
        <div className="text-destructive">
          <div className="font-medium">{part.data.name}</div>
          {part.data.error && (
            <div className="text-sm mt-1 text-muted-foreground">
              Error: {part.data.error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Completed state
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">{part.data.name || "Location"}</h3>
            <p className="text-sm text-muted-foreground">
              Geographic coordinates
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <span className="text-muted-foreground">Latitude:</span>
          <div className="font-mono font-medium">{part.data.latitude}</div>
        </div>
        <div className="space-y-1">
          <span className="text-muted-foreground">Longitude:</span>
          <div className="font-mono font-medium">{part.data.longitude}</div>
        </div>
      </div>
    </div>
  );
};
