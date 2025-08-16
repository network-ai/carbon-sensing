// ============================================================
// 2. SERVER ROUTE - Updated untuk handle semua file types dengan storage
// ============================================================

import { createEntry, type Message } from "@/ai";
import { chatDB, streamDb } from "@/config/db";
import { pubSub } from "@/config/pub-sub";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { createUIMessageStream, JsonToSseTransformStream } from "ai";
import { createResumableStreamContext } from "resumable-stream";
import { ulid } from "ulid";
import { z } from "zod";

// Import shared stores
import { getFileStoreStats, storeFile } from "@/lib/file-store";
import { getPDFStats, storePDF } from "@/lib/pdf-store";

// Update attachment schema untuk handle semua file types
const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.enum(["geojson", "json", "pdf"]),
  // Untuk geojson/json - content yang akan disimpan
  content: z.string().optional(),
  // Untuk PDF - base64 data
  pdfData: z.string().optional(),
  hideContent: z.boolean().default(false),
});

// Generate instructions untuk LLM - tanpa include content langsung
function generateAttachmentInstructions(attachments: any[]): string {
  const instructions = attachments.map((att) => {
    switch (att.type) {
      case "geojson":
        return `\n\nPlease process the GeoJSON file "${att.name}" using the upload-geojson tool with fileName: "${att.name}".`;

      case "json":
        return `\n\nPlease process the JSON file "${att.name}" using appropriate analysis tools with fileName: "${att.name}".`;

      case "pdf":
        return `\n\nPlease process the PDF file "${att.name}" (${Math.round(att.size / 1024)}KB) using the upload-lcam-pdf tool with fileName: "${att.name}".`;

      default:
        return `\n\nAttached file: ${att.name} (${att.type})`;
    }
  });

  return instructions.join("");
}

// Update chat schema untuk support attachments
const chatSchema = z.object({
  message: z.object({
    id: z.string().ulid(),
    role: z.enum(["user"]),
    parts: z.array(
      z.object({
        type: z.enum(["text"]),
        text: z.string().min(1).max(2000),
      }),
    ),
    attachments: z.array(attachmentSchema).optional(),
  }),
});

/**
 * resumable streaming chat messages dengan support file storage
 * - POST: send a new message to the chat and stream to the client
 * - GET: get the latest stream for the chat and continue the stream
 */
export const ServerRoute = createServerFileRoute("/chat/$id/stream").methods({
  POST: async ({ request, params }) => {
    const chatId = params.id;

    const data = await request
      .json()
      .then(chatSchema.parse)
      .catch((error) => {
        throw new Error(`Invalid request data: ${error.message}`);
      });

    if (!chatDB.has(chatId)) chatDB.set(chatId, []);

    // Process attachments dan store files
    if (data.message.attachments && data.message.attachments.length > 0) {
      const attachmentsForDB = data.message.attachments.map((att) => {
        if (att.type === "pdf" && att.pdfData) {
          // Store PDF data ke SharedPDFStore
          storePDF(att.name, att.pdfData);

          console.log(`PDF stored: ${att.name} (${att.pdfData.length} chars)`);
          console.log("PDF Store Stats:", getPDFStats());

          return {
            ...att,
            pdfData: undefined, // Remove dari DB untuk save space
            pdfStored: true,
          };
        } else if (
          (att.type === "geojson" || att.type === "json") &&
          att.content
        ) {
          // Store JSON/GeoJSON content ke FileStore
          storeFile(att.name, att.content);

          console.log(
            `${att.type.toUpperCase()} stored: ${att.name} (${att.content.length} chars)`,
          );
          console.log("File Store Stats:", getFileStoreStats());

          return {
            ...att,
            content: undefined, // Remove dari DB untuk save space
            fileStored: true,
          };
        }
        return att;
      });

      // Clone message untuk disimpan di DB (tanpa content)
      const messageForDB = {
        ...data.message,
        attachments: attachmentsForDB,
      };

      chatDB.get(chatId)?.push(messageForDB);

      // Buat pesan khusus untuk LLM dengan instruction untuk process files
      const llmMessage = {
        ...data.message,
        parts: [
          ...data.message.parts,
          {
            type: "text" as const,
            text: generateAttachmentInstructions(data.message.attachments),
          },
        ],
      };

      const prevMessages = chatDB.get(chatId) || [];
      const messages: Message[] = [...prevMessages.slice(0, -1), llmMessage];

      return createStreamResponse(chatId, messages);
    } else {
      // Normal message tanpa attachments
      chatDB.get(chatId)?.push(data.message);
      const prevMessages = chatDB.get(chatId) || [];
      const messages: Message[] = [...prevMessages, data.message];

      return createStreamResponse(chatId, messages);
    }
  },

  GET: async ({ params }) => {
    const emptyDataStream = createUIMessageStream({
      execute: () => {},
    });

    const streamIds = streamDb.get(params.id);

    if (!streamIds)
      return new Response("No stream found for this chat ID", {
        status: 400,
      });

    const recentStreamId = Array.from(streamIds).pop();

    if (!recentStreamId)
      return new Response("No recent stream found for this chat ID", {
        status: 400,
      });

    const streamContext = createResumableStreamContext({
      waitUntil: () => {},
      publisher: pubSub,
      subscriber: pubSub,
    });

    return new Response(
      await streamContext.resumableStream(recentStreamId, () =>
        emptyDataStream.pipeThrough(new JsonToSseTransformStream()),
      ),
    );
  },
});

/**
 * Create stream response dengan optional context data
 */
async function createStreamResponse(chatId: string, messages: Message[]) {
  const streamContext = createResumableStreamContext({
    waitUntil: () => {},
    publisher: pubSub,
    subscriber: pubSub,
  });

  const streamId = ulid();

  if (streamDb.has(chatId)) streamDb.get(chatId)?.add(streamId);
  else streamDb.set(chatId, new Set([streamId]));

  const stream = createUIMessageStream<Message>({
    generateId: ulid,
    execute: ({ writer }) => {
      const result = createEntry(
        {
          writer,
          chat: {
            id: chatId,
            messages: [],
          },
        },
        messages,
      );

      result.consumeStream();

      writer.merge(
        result.toUIMessageStream<Message>({
          sendSources: true,
          sendReasoning: true,
        }),
      );
    },
    onFinish: async ({ responseMessage }) => {
      chatDB.get(chatId)?.push({
        id: responseMessage.id,
        role: "assistant",
        parts: responseMessage.parts,
      });
    },
    onError: () => {
      return "Oops! Something went wrong, please try again later.";
    },
  });

  return new Response(
    await streamContext.resumableStream(streamId, () =>
      stream.pipeThrough(new JsonToSseTransformStream()),
    ),
  );
}

// Export store functions untuk digunakan di tools
export { getFile, getFileStoreStats, storeFile } from "@/lib/file-store";
export { getPDF, getPDFStats, storePDF } from "@/lib/pdf-store";
