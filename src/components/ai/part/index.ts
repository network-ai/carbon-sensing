import type { Message } from "@/ai";

export { DocumentLCAM } from "./document-lcam";
export { MapsGeoJSON } from "./maps-geojson";
export { MapsPoint } from "./maps-point";
export { Markdown } from "./markdown";
export { Measurement } from "./measurement";
export { Weather } from "./weather";

export type ToolPart<T extends Message["parts"][number]["type"]> = Extract<
  Message["parts"][number],
  { type: T }
>;
