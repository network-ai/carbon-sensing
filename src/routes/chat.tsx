import { lazy, Suspense } from "react";
import { cn } from "@/utils/classnames";
import { store } from "@/components/ai/store";
import { MapProvider } from "@/components/ui/maps-context";
import { createFileRoute, Outlet } from "@tanstack/react-router";

const Maps = lazy(() =>
  import("@/components/ai/maps").then((mod) => ({
    default: mod.Maps,
  })),
);

export const Route = createFileRoute("/chat")({
  component: () => {
    const map = store((s) => s.map);

    return (
      <MapProvider>
        <div className="flex flex-row w-full justify-end transition-all duration-300 ease-in-out">
          <div
            className={cn(
              "relative w-full max-w-full h-svh z-20",
              "transition-all duration-300 ease-in-out",
              map && "p-4 max-w-sm",
            )}
          >
            <div
              className={cn(
                "bg-background/90 flex size-full",
                "transition-all duration-300 ease-in-out",
                map && "rounded-md border shadow-lg",
              )}
            >
              <Outlet />
            </div>
          </div>
        </div>
        <Suspense>
          <Maps />
        </Suspense>
      </MapProvider>
    );
  },
});
