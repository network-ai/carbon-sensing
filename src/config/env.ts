import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  /**
   * LLM provider api
   */
  LLM_GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
  BASE_URL: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
