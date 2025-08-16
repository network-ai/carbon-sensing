import type { WeatherCondition } from "@/ai/parts";
import type { ToolPart } from "@/components/ai/part";
import { cn } from "@/utils/classnames";
import { cva } from "class-variance-authority";
import {
  Cloud,
  CloudDrizzle,
  CloudHail,
  CloudRain,
  CloudSnow,
  Cloudy,
  HelpCircle,
  Sun,
  Wind,
  Zap,
} from "lucide-react";
import type { FC } from "react";

// Weather icon mapping using Lucide React icons
const WEATHER_ICON_MAP: Record<
  WeatherCondition,
  React.ComponentType<{ className?: string }>
> = {
  sunny: Sun,
  clear: Sun,
  "partly-cloudy": Cloudy,
  cloudy: Cloud,
  overcast: Cloud,
  drizzle: CloudDrizzle,
  "light-rain": CloudRain,
  rain: CloudRain,
  "heavy-rain": CloudRain,
  thunderstorm: Zap,
  snow: CloudSnow,
  "light-snow": CloudSnow,
  "heavy-snow": CloudSnow,
  sleet: CloudHail,
  hail: CloudHail,
  fog: Cloud,
  mist: Cloud,
  windy: Wind,
  unknown: HelpCircle,
};

// Weather card variants using CVA - only for conditions
const weatherCardVariants = cva(
  [
    "rounded-lg border shadow-sm p-4 relative overflow-hidden",
    "transition-all duration-300 ease-in-out",
  ],
  {
    variants: {
      condition: {
        sunny: "bg-gradient-to-br from-yellow-400 to-orange-500 text-white",
        clear: "bg-gradient-to-br from-blue-400 to-blue-600 text-white",
        "partly-cloudy":
          "bg-gradient-to-br from-blue-300 to-gray-400 text-white",
        cloudy: "bg-gradient-to-br from-gray-400 to-gray-600 text-white",
        overcast: "bg-gradient-to-br from-gray-500 to-gray-700 text-white",
        drizzle: "bg-gradient-to-br from-blue-400 to-gray-500 text-white",
        "light-rain": "bg-gradient-to-br from-blue-500 to-gray-600 text-white",
        rain: "bg-gradient-to-br from-blue-600 to-gray-700 text-white",
        "heavy-rain": "bg-gradient-to-br from-blue-700 to-gray-800 text-white",
        thunderstorm:
          "bg-gradient-to-br from-purple-600 to-gray-800 text-white",
        snow: "bg-gradient-to-br from-blue-100 to-gray-300 text-gray-800",
        "light-snow":
          "bg-gradient-to-br from-blue-50 to-gray-200 text-gray-800",
        "heavy-snow": "bg-gradient-to-br from-blue-200 to-gray-400 text-white",
        sleet: "bg-gradient-to-br from-blue-300 to-gray-500 text-white",
        hail: "bg-gradient-to-br from-blue-400 to-gray-600 text-white",
        fog: "bg-gradient-to-br from-gray-300 to-gray-500 text-white",
        mist: "bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800",
        windy: "bg-gradient-to-br from-green-300 to-blue-400 text-white",
        unknown: "bg-gradient-to-br from-gray-300 to-gray-500 text-white",
      },
    },
    defaultVariants: {
      condition: "unknown",
    },
  },
);

export const Weather: FC<{
  part: ToolPart<"data-weather">;
  className?: string;
}> = ({ part, className }) => {
  if (part.data.state === "in-progress")
    return (
      <div
        className={cn(
          "rounded-lg border shadow-sm p-4 bg-card text-card-foreground",
          className,
        )}
      >
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">{part.data.name}</span>
        </div>
      </div>
    );

  if (part.data.state === "failed")
    return (
      <div
        className={cn(
          "rounded-lg border shadow-sm p-4 bg-card text-card-foreground",
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

  // Completed state
  const { temperature, humidity, precipitation, condition, location, time } =
    part.data;

  const WeatherIcon = WEATHER_ICON_MAP[condition];

  return (
    <div className={cn(weatherCardVariants({ condition }), className)}>
      {/* Optional overlay for better text readability */}
      <div className="absolute inset-0 bg-black/10 rounded-lg"></div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <div>
            <h3 className="font-semibold">{location}</h3>
            <p className="text-xs opacity-80">{time}</p>
          </div>

          <div>
            <div className="flex space-x-2">
              <span className="opacity-80">Humidity:</span>
              <span className="font-medium">{humidity}%</span>
            </div>

            <div className="flex space-x-2">
              <span className="opacity-80">Precipitation:</span>
              <span className="font-medium">{precipitation}mm</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <div className="text-3xl mb-1">
            <WeatherIcon className="w-8 h-8" />
          </div>
          <div className="text-2xl font-bold">{temperature}°C</div>
          <p className="text-sm opacity-90 capitalize">
            {condition.replace("-", " ")}
          </p>
        </div>
      </div>
    </div>
  );
};
