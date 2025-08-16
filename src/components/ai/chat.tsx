// ============================================================
// 1. CHAT COMPONENT - Updated untuk semua file types dengan storage
// ============================================================

import type { Message } from "@/ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/text-area";
import { Toggle } from "@/components/ui/toggle";
import { useChat } from "@ai-sdk/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import {
  Bot,
  File,
  FileText,
  LucideUpload,
  MapIcon,
  Send,
  X,
  XIcon,
} from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { ulid } from "ulid";
import { Messages } from "./messages";
import { store } from "./store";

interface ChatProps {
  id: string;
  messages: Message[];
}

interface AttachedFile {
  file: File;
  id: string;
}

// Update Message interface untuk include attachments tanpa content
interface MessageWithAttachments extends Message {
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: "geojson" | "json" | "pdf";
    // Semua file types sekarang tidak include content di message
    // Content disimpan di server-side storage
    fileStored?: boolean; // Flag bahwa file sudah disimpan
    hideContent?: boolean;
  }>;
}

export const Chat: React.FC<ChatProps> = (props) => {
  const navigate = useNavigate();
  const map = store((s) => s.map);

  const [input, setInput] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isSending, setIsSending] = useState(false);

  const { messages, sendMessage, status } = useChat<MessageWithAttachments>({
    id: props.id,
    resume: true,
    messages: props.messages as MessageWithAttachments[],
    generateId: ulid,
    experimental_throttle: 100,
    transport: new DefaultChatTransport({
      prepareReconnectToStreamRequest: ({ id }) => ({
        api: `/chat/${id}/stream`,
      }),
      prepareSendMessagesRequest: ({ messages, id, body }) => ({
        api: `/chat/${id}/stream`,
        body: { message: messages.at(-1), ...body },
      }),
    }),
  });

  const getFileType = (fileName: string): "geojson" | "json" | "pdf" | null => {
    if (fileName.endsWith(".geojson")) return "geojson";
    if (fileName.endsWith(".json")) return "json";
    if (fileName.endsWith(".pdf")) return "pdf";
    return null;
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <File className="h-5 w-3 text-red-500" />;
      case "geojson":
        return <FileText className="h-3 w-3 text-green-500" />;
      case "json":
        return <FileText className="h-5 w-3 text-blue-500" />;
      default:
        return <FileText className="h-5 w-3 text-gray-500" />;
    }
  };

  // Convert File ke base64 (untuk PDF)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  // Convert File ke text (untuk JSON/GeoJSON)
  const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const fileType = getFileType(file.name);
      if (!fileType) {
        alert(
          "Unsupported file type. Please upload .pdf, .json, or .geojson files.",
        );
        return;
      }

      // Check file size limits
      const maxSize = fileType === "pdf" ? 5 * 1024 * 1024 : 5 * 1024 * 1024; // 5MB for PDF, 2MB for JSON/GeoJSON
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        alert(
          `File too large. Maximum size is ${maxSizeMB}MB for ${fileType.toUpperCase()} files.`,
        );
        return;
      }

      const attachedFile: AttachedFile = {
        file,
        id: ulid(),
      };

      setAttachedFiles((prev) => [...prev, attachedFile]);
      event.target.value = "";
    },
    [],
  );

  const removeAttachment = useCallback((fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const submitForm = useCallback(async () => {
    if (
      (!input.trim() && attachedFiles.length === 0) ||
      status === "streaming" ||
      isSending
    )
      return;

    setIsSending(true);

    try {
      if (attachedFiles.length > 0) {
        const processedAttachments = await Promise.all(
          attachedFiles.map(async (f) => {
            const fileType = getFileType(f.file.name)!;

            if (fileType === "pdf") {
              // Convert PDF ke base64
              const base64Data = await fileToBase64(f.file);
              return {
                id: f.id,
                name: f.file.name,
                size: f.file.size,
                type: fileType,
                pdfData: base64Data, // Masih kirim base64 untuk PDF
                hideContent: false,
              };
            } else {
              // JSON/GeoJSON: kirim content untuk disimpan di server
              const content = await fileToText(f.file);

              // Validate JSON format
              try {
                JSON.parse(content);
              } catch (parseError) {
                throw new Error(
                  `Invalid ${fileType.toUpperCase()} format in file: ${f.file.name}`,
                );
              }

              return {
                id: f.id,
                name: f.file.name,
                size: f.file.size,
                type: fileType,
                content: content, // Kirim content untuk disimpan di server
                hideContent: false,
              };
            }
          }),
        );

        // Create attachment summary untuk display
        const attachmentSummary = processedAttachments
          .map((att) => {
            const icon =
              att.type === "pdf" ? "📄" : att.type === "geojson" ? "🗺️" : "📋";
            return `${icon} ${att.name} (${Math.round(att.size / 1024)}KB)`;
          })
          .join(", ");

        const displayText = input
          ? `${input}\n\nUploaded: ${attachmentSummary}`
          : `Uploaded: ${attachmentSummary}`;

        const messageWithAttachments = {
          id: ulid(),
          role: "user" as const,
          parts: [{ type: "text" as const, text: displayText }],
          attachments: processedAttachments,
        };

        await sendMessage(messageWithAttachments);
      } else {
        // Regular text message
        await sendMessage({
          id: ulid(),
          role: "user" as const,
          parts: [{ type: "text" as const, text: input }],
        });
      }

      // Clear state setelah sukses
      setInput("");
      setAttachedFiles([]);
      await navigate({ to: `/chat/$id`, params: { id: props.id } });
    } catch (error) {
      console.error("Error sending message:", error);
      alert(
        `Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsSending(false);
    }
  }, [
    sendMessage,
    input,
    attachedFiles,
    props.id,
    navigate,
    status,
    isSending,
  ]);

  return (
    <div className="size-full flex flex-col overflow-hidden items-center justify-center space-y-4 py-2">
      <div className="px-4 w-full flex flex-col items-center">
        <div className="w-full max-w-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <Bot className="h-6 w-6 text-primary" />
            <h1 className="font-bold">CarbonSensingAI</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Toggle
              size="sm"
              pressed={map}
              className="p-1"
              variant="outline"
              aria-label="Toggle Maps View"
              onPressedChange={store.getState().toggleMap}
            >
              <MapIcon className="size-4" />
            </Toggle>
            <Button
              asChild
              size="icon"
              variant="outline"
              className="size-8 text-xs"
            >
              <Link to="/chat">
                <XIcon className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Messages messages={messages} />

      <div className="px-4 w-full flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-4">
          {/* File Attachments Preview */}
          {attachedFiles.length > 0 && (
            <div className="space-y-2">
              {attachedFiles.map((attachedFile) => {
                const fileType = getFileType(attachedFile.file.name);

                return (
                  <div
                    key={attachedFile.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(fileType || "unknown")}
                      <div>
                        <p className="text-sm font-medium">
                          {attachedFile.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(attachedFile.file.size / 1024)}KB •{" "}
                          {fileType?.toUpperCase()} • Ready to process
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAttachment(attachedFile.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Input Area */}
          <div className="relative">
            <Textarea
              rows={4}
              autoFocus
              value={input}
              className="bg-background p-2"
              disabled={status === "streaming"}
              placeholder={
                attachedFiles.length > 0
                  ? "Add instructions for your files (optional)..."
                  : "Ask about locations, documents, spatial data, maps, or geographic insights..."
              }
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (status === "streaming") return e.preventDefault();

                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitForm();
                }
              }}
            />

            <div className="absolute right-2 bottom-2 flex gap-2">
              <input
                type="file"
                accept=".geojson,.json,.pdf"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                id="file-upload"
                multiple={false}
              />
              <label htmlFor="file-upload">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  type="button"
                  asChild
                  disabled={status === "streaming"}
                >
                  <span>
                    <LucideUpload className="h-3 w-3" />
                  </span>
                </Button>
              </label>

              <Button
                size="sm"
                onClick={submitForm}
                disabled={
                  status === "streaming" ||
                  isSending ||
                  (!input.trim() && attachedFiles.length === 0)
                }
                className="h-7 space-x-1 text-xs"
              >
                <Send className="h-3 w-3" />
                <span>{isSending ? "Sending..." : "Send"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
