import type { Message } from "@/ai";

export const streamDb = new Map<string, Set<string>>();

export const chatDB = new Map<string, Message[]>();
