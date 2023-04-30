import React from "react";

import * as RadixPopover from "@radix-ui/react-popover";

export function Button(props: any): JSX.Element {
  return (
    <div
      {...props}
      className="block px-2 py-1 rounded cursor-pointer outline-0 border border-dark-8% hover:border-brand-base hover:text-brand-base"
    />
  );
}

export const Root = RadixPopover.Root;
export const Trigger = RadixPopover.Trigger;
export const Content = RadixPopover.Content;
export const Portal = RadixPopover.Portal;
