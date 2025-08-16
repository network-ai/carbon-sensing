import tailwind from "@/tailwind.css?url";
import type { RouterContext } from "@/router";
import { DevTools } from "@/components/dev-tools";
import {
  Outlet,
  Scripts,
  HeadContent,
  createRootRouteWithContext,
} from "@tanstack/react-router";

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "Spasial AI Platform" },
      { name: "description", content: "Spasial AI Platform" },
    ],
    links: [{ rel: "stylesheet", href: tailwind }],
  }),
  component: RootComponent,
  notFoundComponent: () => <div>No FOund</div>,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <DevTools />
        <Scripts />
      </body>
    </html>
  );
}
