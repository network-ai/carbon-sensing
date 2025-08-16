import { ulid } from "ulid";
import { Chat } from "@/components/ai/chat";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/chat/")({
  component: () => <Chat id={ulid()} messages={[]} />,
});
