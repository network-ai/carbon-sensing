import { env } from "@/config/env";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: env.LLM_GOOGLE_GENERATIVE_AI_API_KEY,
});

export const locationModel = google("gemini-2.5-pro");
export const textGenerationModel = google("gemini-2.5-pro");
export const documentParseModel = google("gemini-2.5-pro");

// export const locationModel = anthropic('claude-3-haiku-20240307');
// export const textGenerationModel = anthropic('claude-3-haiku-20240307');
// export const documentParseModel = anthropic('claude-sonnet-4-20250514');
