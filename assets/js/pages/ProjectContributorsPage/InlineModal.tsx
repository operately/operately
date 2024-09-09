import React from "react";
import { IconX } from "@tabler/icons-react";

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function InlineModal(props: Props) {
  return (
    <div className="shadow-lg rounded-lg p-8 border border-callout-warning-icon bg-callout-warning">
      <Title title={props.title} onClose={props.onClose} />

      {props.children}
    </div>
  );
}

function Title({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between mb-8 border-b border-stroke-base pb-2">
      <h2 className="font-bold text-lg">{title}</h2>
      <IconX size={24} className="cursor-pointer text-content-dimmed hover:text-content-accent" onClick={onClose} />
    </div>
  );
}
