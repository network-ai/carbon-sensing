import type * as React from "react";
import { cn } from "@/utils/classnames";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

const Avatar: React.FC<React.ComponentProps<typeof AvatarPrimitive.Root>> = ({
  className,
  ...props
}) => (
  <AvatarPrimitive.Root
    data-slot="avatar"
    className={cn(
      "relative flex size-8 shrink-0 overflow-hidden rounded-full",
      className,
    )}
    {...props}
  />
);

const AvatarImage: React.FC<
  React.ComponentProps<typeof AvatarPrimitive.Image>
> = ({ className, ...props }) => (
  <AvatarPrimitive.Image
    data-slot="avatar-image"
    className={cn("aspect-square size-full", className)}
    {...props}
  />
);

const AvatarFallback: React.FC<
  React.ComponentProps<typeof AvatarPrimitive.Fallback>
> = ({ className, ...props }) => (
  <AvatarPrimitive.Fallback
    data-slot="avatar-fallback"
    className={cn(
      "bg-muted flex size-full items-center justify-center rounded-full",
      className,
    )}
    {...props}
  />
);

export { Avatar, AvatarImage, AvatarFallback };
