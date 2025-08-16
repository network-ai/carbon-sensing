import type { Parts } from "@/ai/parts";
import { tools, type Tools } from "@/ai/tools";
import {
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  streamText,
  type InferUITool,
  type UIMessage,
  type UIMessageStreamWriter,
} from "ai";
import { ulid } from "ulid";
import { documentParseModel } from "./provider";

export type Message = UIMessage<
  unknown,
  Parts,
  { [K in keyof Tools]: InferUITool<Tools[K]> }
>;

/**
 * all context that is passed to tools.
 */
export type CreateToolsContext = {
  /**
   * A stream writer t o write data to the chat session.
   */
  chat: {
    id: string; // ID chat
    messages: Message[]; // Opsional: jika Anda ingin tool bisa mengakses semua pesan
  };
  writer: UIMessageStreamWriter<Message>;
};

/**
 * main entry for the chat session, and all tools
 */
export const createEntry = (ctx: CreateToolsContext, messages: Message[]) =>
  streamText<Tools>({
    model: documentParseModel,
    system: `You are Spasial AI, an intelligent spatial analysis assistant. You help users understand, analyze, and work with geospatial data, maps, and location-based information. 

Available tools:
- find-location: Find geographical locations
- get-weather: Get weather information
- upload-geojson: Upload GeoJSON files
- analyze-carbon-stock: Analyze carbon stock analysis for any given year with remote sensing
- upload-lcam-pdf: Upload and process LCAM verification documents
- generate-report: Generate report from LCAM pdf and carbon stock analysis
- compare-carbon-credits: Compare carbon credit from LCAM document and carbon stock remote sensing based
- find-anomaly: Find anomaly based comparation carbon sensing and LCAM document
IMPORTANT: Always use the exact tool names listed above. For carbon stock analysis or spatial measurements, use "analyze-carbon-stock".

Be helpful, accurate, and explain spatial concepts clearly.`,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),

    /**
     * all tools that are available in the chat
     */
    tools: {
      "find-location": tools["find-location"](ctx),
      "get-weather": tools["get-weather"](ctx),
      "upload-geojson": tools["upload-geojson"](ctx),
      "analyze-carbon-stock": tools["analyze-carbon-stock"](ctx),
      analyze: tools["analyze-carbon-stock"](ctx), // Alias for convenience
      "upload-lcam-pdf": tools["upload-lcam-pdf"](ctx),
      upload: tools["upload-lcam-pdf"](ctx),
      "compare-carbon-credits": tools["compare-carbon-credits"](ctx),
      compare: tools["compare-carbon-credits"](ctx),
      "report-carbon-stock": tools["report-carbon-stock"](ctx),
      report: tools["report-carbon-stock"](ctx),
      "find-anomaly": tools["find-anomaly"](ctx),
      "generate-environmental-redflag1":
        tools["generate-environmental-redflag1"](ctx),
      "generate-environmental-redflag2":
        tools["generate-environmental-redflag2"](ctx),
      "generate-financial-redflag1": tools["generate-financial-redflag1"](ctx),
      "generate-financial-redflag2": tools["generate-financial-redflag2"](ctx),
      "generate-redflag": tools["generate-redflag"](ctx),
      generate: tools["report-carbon-stock"](ctx),
      "generate-report": tools["report-carbon-stock"](ctx),
    },

    /**
     * internal utilities
     */
    _internal: {
      generateId: ulid,
      currentDate: () => new Date(),
    },
    /**
     * experimental features
     */
    experimental_transform: [smoothStream({ chunking: "word" })],
  });
