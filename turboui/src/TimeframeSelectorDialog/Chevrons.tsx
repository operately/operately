import React from "react";
import { IconChevronLeft, IconChevronRight } from "../icons";
import { UnstyledButton } from "../Button/UnstalyedButton";

interface Props {
  onClick: () => void;
  label: string;
}

export function LeftChevron({ onClick, label }: Props) {
  return (
    <UnstyledButton onClick={onClick} ariaLabel={label} className="text-content-dimmed hover:text-content">
      <IconChevronLeft size={16} />
    </UnstyledButton>
  );
}

export function RightChevron({ onClick, label }: Props) {
  return (
    <UnstyledButton onClick={onClick} ariaLabel={label} className="text-content-dimmed hover:text-content">
      <IconChevronRight size={16} />
    </UnstyledButton>
  );
}
