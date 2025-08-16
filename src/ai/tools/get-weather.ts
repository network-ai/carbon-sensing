import z from "zod";
import { tool } from "ai";
import { ulid } from "ulid";
import type { CreateToolsContext } from "@/ai";
import type { WeatherCondition } from "@/ai/parts";

interface GeocodingResponse {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country: string;
  }>;
}

interface WeatherResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    time: string;
  };
  current_units: {
    temperature_2m: string;
    relative_humidity_2m: string;
    precipitation: string;
  };
}

/**
 * tool to get current weather information for a location using free OpenMeteo API.
 *
 * @param {CreateToolsContext} ctx
 * @returns
 */
export const getWeather = (ctx: CreateToolsContext) =>
  tool({
    name: "get-weather",
    description: "Get current weather information for a specific location",
    inputSchema: z.object({
      location: z
        .string()
        .describe(
          "Location name to get weather for (city, address, coordinates)",
        ),
    }),
    execute: async ({ location }) => {
      const dataId = ulid();

      ctx.writer.write({
        id: dataId,
        type: "data-weather",
        data: {
          name: `Getting weather for: ${location}`,
          state: "in-progress",
        },
      });

      // First, get coordinates for the location using OpenMeteo's geocoding API
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;

      return await fetch(geocodingUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`Geocoding API error: ${res.status}`);
          return res.json();
        })
        .then(async (data: GeocodingResponse) => {
          if (!data.results || data.results.length === 0)
            throw new Error(`Location "${location}" not found`);

          const { latitude, longitude, name, country } = data.results[0];

          // Get weather data using OpenMeteo API (free, no API key required)
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=auto`;

          return fetch(weatherUrl)
            .then((data) => {
              if (!data.ok)
                throw new Error(`Weather API error: ${data.status}`);
              return data.json();
            })
            .then((data: WeatherResponse) => {
              // Convert weather code to condition
              const getWeatherCondition = (code: number): WeatherCondition => {
                if (code === 0) return "clear";
                if (code <= 3) return "cloudy";
                if (code <= 48) return "fog";
                if (code <= 57) return "drizzle";
                if (code <= 67) return "rain";
                if (code <= 77) return "snow";
                if (code <= 82) return "rain";
                if (code <= 86) return "snow";
                if (code <= 99) return "thunderstorm";
                return "unknown";
              };

              const condition = getWeatherCondition(data.current.weather_code);

              const location = `${name}, ${country}`;

              ctx.writer.write({
                id: dataId,
                type: "data-weather",
                data: {
                  name: `Weather for: ${location}`,
                  state: "completed",

                  /**
                   * location and time information
                   */
                  time: new Date(data.current.time).toLocaleString(),
                  location: location,

                  /**
                   * current weather information
                   */
                  condition: condition,
                  humidity: data.current.relative_humidity_2m,
                  temperature: Math.round(data.current.temperature_2m),
                  precipitation: data.current.precipitation,
                },
              });

              return `Weather information for ${location}: ${Math.round(data.current.temperature_2m)}°C, ${condition}`;
            });
        })
        .catch((error) => {
          ctx.writer.write({
            id: dataId,
            type: "data-weather",
            data: {
              name: `Weather for: ${location}`,
              state: "failed",
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to get weather information",
            },
          });

          throw new Error(`Failed to get weather information for ${location}`);
        });
    },
  });
