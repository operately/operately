import React from "react";
import { IconChevronLeft, IconChevronRight } from "../icons";

export function LeftChevron({ onClick }) {
  return (
    <IconChevronLeft
      size={16}
      onClick={onClick}
      className="cursor-pointer text-content-dimmed hover:text-content"
    />
  );
}

export function RightChevron({ onClick }) {
  return (
    <IconChevronRight
      size={16}
      onClick={onClick}
      className="cursor-pointer text-content-dimmed hover:text-content"
    />
  );
}
