import type * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

interface CollapsibleProps
  extends React.ComponentProps<typeof CollapsiblePrimitive.Root> {}

const Collapsible: React.FC<CollapsibleProps> = ({ ...props }) => {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
};

interface CollapsibleTriggerProps
  extends React.ComponentProps<
    typeof CollapsiblePrimitive.CollapsibleTrigger
  > {}

const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({
  ...props
}) => {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  );
};

interface CollapsibleContentProps
  extends React.ComponentProps<
    typeof CollapsiblePrimitive.CollapsibleContent
  > {}

const CollapsibleContent: React.FC<CollapsibleContentProps> = ({
  ...props
}) => {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  );
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
