import * as React from "react";
import * as Icons from "@tabler/icons-react";

export function LeftChevron({ onClick }) {
  return (
    <Icons.IconChevronLeft
      size={16}
      onClick={onClick}
      className="cursor-pointer text-content-dimmed hover:text-content"
    />
  );
}

export function RightChevron({ onClick }) {
  return (
    <Icons.IconChevronRight
      size={16}
      onClick={onClick}
      className="cursor-pointer text-content-dimmed hover:text-content"
    />
  );
}
