import type { Message } from "@/ai";
import { Chat } from "@/components/ai/chat";
import { chatDB } from "@/config/db";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type DeepConvertUnknown<T> = T extends unknown
  ? unknown extends T
    ? object
    : T extends (infer U)[]
      ? DeepConvertUnknown<U>[]
      : T extends object
        ? { [K in keyof T]: DeepConvertUnknown<T[K]> }
        : T
  : never;

const getMessages = createServerFn({ method: "GET" })
  .validator(z.object({ chatId: z.string() }))
  .handler(async ({ data }) => {
    // Instead of throwing error, create chat if it doesn't exist
    if (!chatDB.has(data.chatId)) {
      // Initialize empty chat
      chatDB.set(data.chatId, []);
    }

    const messages = chatDB.get(data.chatId) as DeepConvertUnknown<Message>[];

    return messages;
  });

const messagesQueryOptions = (chatId: string) =>
  queryOptions({
    queryKey: ["messages", chatId],
    queryFn: async () => await getMessages({ data: { chatId } }),
  });

export const Route = createFileRoute("/chat/$id")({
  beforeLoad: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(messagesQueryOptions(params.id));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();

  const messages = useQuery(messagesQueryOptions(params.id));

  return <Chat id={params.id} messages={messages.data as Message[]} />;
}
