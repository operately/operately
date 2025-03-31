import React from "react";
import { IconChevronDown, IconChevronLeft, IconProps } from "@tabler/icons-react";

export function ExpandIcon({ expanded, ...rest }: IconProps & { expanded: boolean }) {
  const Icon = expanded ? IconChevronDown : IconChevronLeft;
  return <Icon {...rest} />;
}
