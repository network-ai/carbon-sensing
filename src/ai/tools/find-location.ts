import type { CreateToolsContext } from "@/ai";
import { locationModel } from "@/ai/provider";
import { generateObject, tool } from "ai";
import { ulid } from "ulid";
import z from "zod";

/**
 * tool to find location coordinates by name.
 *
 * @param {CreateToolsContext} ctx
 * @returns
 */
export const findLocation = (ctx: CreateToolsContext) =>
  tool({
    name: "find-location",
    description: "Find location coordinates by name",
    inputSchema: z.object({
      name: z.string().describe("Name of the location to find coordinates for"),
    }),
    execute: async ({ name }) => {
      const dataId = ulid();

      ctx.writer.write({
        id: dataId,
        type: `data-maps-point`,
        data: {
          name: `Searching for coordinates of: ${name}`,
          state: "in-progress",
        },
      });

      return await generateObject({
        model: locationModel,
        system:
          "You are a precise geolocation service. Given a location name, return the exact coordinates. For cities, use the city center coordinates. For landmarks, use the specific landmark coordinates. For addresses, geocode to precise coordinates. Always provide realistic latitude/longitude values. Set appropriate zoom levels: 15+ for specific addresses/landmarks, 10-12 for neighborhoods, 8-10 for cities, 5-8 for regions/states.",
        prompt: name,
        schema: z.object({
          latitude: z.number().describe("Latitude of the location"),
          longitude: z.number().describe("Longitude of the location"),
          zoom: z
            .number()
            .optional()
            .default(10)
            .describe("Zoom level for the map view, optional"),
          pitch: z
            .number()
            .optional()
            .default(0)
            .describe("Pitch angle for the map view, optional"),
          bearing: z
            .number()
            .optional()
            .default(0)
            .describe("Bearing angle for the map view, optional"),
        }),
      })
        .then((result) => {
          ctx.writer.write({
            id: dataId,
            type: "data-maps-point",
            data: {
              name: `Coordinates for: ${name}`,
              state: "completed",
              latitude: result.object.latitude,
              longitude: result.object.longitude,
              zoom: result.object.zoom,
              pitch: result.object.pitch,
              bearing: result.object.bearing,
            },
          });

          return `Coordinates for ${name} found.`;
        })
        .catch((error) => {
          ctx.writer.write({
            id: dataId,
            type: "data-maps-point",
            data: {
              name: `Error finding coordinates for: ${name}`,
              state: "failed",
              error: error.message,
            },
          });
          throw new Error(`Failed to find location coordinates for ${name}`);
        });
    },
  });
