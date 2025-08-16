import type { Message } from "@/ai";
import {
  MapsPoint,
  Markdown,
  Measurement,
  Weather,
} from "@/components/ai/part";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowDownIcon, Bot, FileText, MapPin, User } from "lucide-react";
import React, { useCallback } from "react";
import { match } from "ts-pattern";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { CompareCarbonCredits } from "./part/compare";
import { DocumentLCAM } from "./part/document-lcam";
import { CarbonStockReport } from "./part/document-report";
import { MapsGeoJSON } from "./part/maps-geojson";

// Extend Message interface untuk support attachments
interface MessageWithAttachments extends Message {
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: "geojson" | "json" | "pdf";
    // Untuk geojson/json: simpan sebagai string content
    content?: string;
    // Untuk PDF: simpan sebagai File object
    file?: File;
    hideContent?: boolean;
  }>;
}
const MessageAvatar: React.FC<{ role: "assistant" | "user" }> = React.memo(
  ({ role }) => (
    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground flex flex-row items-center gap-1">
      <Avatar>
        <AvatarFallback>
          {role === "assistant" && (
            <Bot className="h-4 w-4 text-muted-foreground" />
          )}

          {role === "user" && (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="capitalize">{role}</div>
    </div>
  ),
  (prevProps, nextProps) => prevProps.role === nextProps.role,
);

// UPDATE: Component untuk render attachments dengan PDF support
const MessageAttachments: React.FC<{
  attachments: MessageWithAttachments["attachments"];
  role: "assistant" | "user";
}> = ({ attachments, role }) => {
  if (!attachments || attachments.length === 0) return null;

  // Helper function untuk get icon dan color berdasarkan file type
  const getAttachmentStyles = (type: string) => {
    switch (type) {
      case "geojson":
        return {
          icon: <MapPin className="h-4 w-4 text-blue-500" />,
          badge: {
            bg: "bg-blue-500/10",
            text: "text-blue-700",
            border: "border-blue-500/20",
            label: "GeoJSON",
          },
        };
      case "pdf":
        return {
          icon: <FileText className="h-4 w-4 text-red-500" />,
          badge: {
            bg: "bg-red-500/10",
            text: "text-red-700",
            border: "border-red-500/20",
            label: "PDF",
          },
        };
      case "json":
        return {
          icon: <FileText className="h-4 w-4 text-green-500" />,
          badge: {
            bg: "bg-green-500/10",
            text: "text-green-700",
            border: "border-green-500/20",
            label: "JSON",
          },
        };
      default:
        return {
          icon: <FileText className="h-4 w-4 text-gray-500" />,
          badge: {
            bg: "bg-gray-500/10",
            text: "text-gray-700",
            border: "border-gray-500/20",
            label: "File",
          },
        };
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-3 pt-3 border-t border-border/50">
      <div className="space-y-2">
        {attachments.map((attachment) => {
          const styles = getAttachmentStyles(attachment.type);

          return (
            <div
              key={attachment.id}
              className={`
                flex items-center space-x-2 text-sm p-2 rounded-md
                ${
                  role === "user"
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted/50 border border-border/30"
                }
              `}
            >
              {styles.icon}
              <div className="flex-1">
                <span className="font-medium">{attachment.name}</span>
                <span className="text-muted-foreground ml-2">
                  ({Math.round(attachment.size / 1024)}KB)
                </span>
                {/* Show content status for PDF */}
                {attachment.type === "pdf" && attachment.hideContent && (
                  <span className="text-xs text-muted-foreground ml-2">
                    • Content processed
                  </span>
                )}
              </div>
              <span
                className={`px-2 py-1 text-xs rounded border ${styles.badge.bg} ${styles.badge.text} ${styles.badge.border}`}
              >
                {styles.badge.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MessageItem: React.FC<{ message: MessageWithAttachments }> = ({
  message,
}) => {
  return (
    <div className="py-2 px-4 text-sm size-full">
      <div className="mx-auto max-w-2xl">
        <MessageAvatar role={message.role as "assistant" | "user"} />
      </div>

      {/* Message parts */}
      <div className="space-y-4 size-full">
        {/* every part has it's own size */}
        {message.parts.map((part, idx) =>
          match(part)
            .with({ type: "text" }, (part) => (
              <Markdown
                className="max-w-2xl mx-auto"
                key={`${message.id}-${part.type}-${idx}`}
              >
                {part.text}
              </Markdown>
            ))
            .with({ type: "data-maps-point" }, (part) => (
              <div
                key={`${message.id}-${part.type}-${part.id}`}
                className="max-w-2xl mx-auto"
              >
                <MapsPoint part={part} />
              </div>
            ))
            .with({ type: "data-maps-geojson" }, (part) => (
              <div
                key={`${message.id}-${part.type}-${part.id}`}
                className="max-w-2xl mx-auto"
              >
                <MapsGeoJSON part={part} />
              </div>
            ))
            .with({ type: "data-analyze-carbon-stock" }, (part) => (
              <div
                key={`${message.id}-${part.type}-${part.id}`}
                className="max-w-2xl mx-auto"
              >
                <Measurement part={part} />
              </div>
            ))
            // UPDATE: Fix the type name untuk DocumentLCAM
            .with({ type: "data-document-lcam-processing" }, (part) => (
              <div
                key={`${message.id}-${part.type}-${part.id}`}
                className="max-w-2xl mx-auto"
              >
                <DocumentLCAM part={part} />
              </div>
            ))
            // UPDATE: Fix the type name untuk DocumentLCAM
            .with({ type: "data-carbon-stock-report" }, (part) => (
              <div
                key={`${message.id}-${part.type}-${part.id}`}
                className="max-w-2xl mx-auto"
              >
                <CarbonStockReport part={part} />
              </div>
            ))
            .with({ type: "data-weather" }, (part) => (
              <div
                key={`${message.id}-${part.type}-${part.id}`}
                className="max-w-2xl mx-auto"
              >
                <Weather part={part} />
              </div>
            ))
            .with({ type: "data-compare-carbon-credits" }, (part) => (
              <div
                key={`${message.id}-${part.type}-${part.id}`}
                className="max-w-2xl mx-auto"
              >
                <CompareCarbonCredits part={part} />
              </div>
            ))

            .otherwise(() => null),
        )}

        {/* Render attachments untuk user messages */}
        {message.role === "user" && (
          <MessageAttachments
            attachments={message.attachments}
            role={message.role}
          />
        )}
      </div>
    </div>
  );
};

const ScrollButton = () => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  if (isAtBottom) return null;

  return (
    <Button
      size="icon"
      type="button"
      variant="outline"
      onClick={handleScrollToBottom}
      className="absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full"
    >
      <ArrowDownIcon className="size-4" />
    </Button>
  );
};

export const Messages: React.FC<{ messages: MessageWithAttachments[] }> = ({
  messages,
}) => (
  <StickToBottom
    role="log"
    resize="smooth"
    initial="smooth"
    className="relative flex-1 overflow-auto w-full"
  >
    <StickToBottom.Content className="space-y-2">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </StickToBottom.Content>
    <ScrollButton />
  </StickToBottom>
);
