import * as React from "react";

import { IconSearch } from "../icons";

interface SearchActivatorProps {
  placeholder: string;
  onActivate: () => void;
  testId?: string;
}

export function SearchActivator({ placeholder, onActivate, testId }: SearchActivatorProps) {
  return (
    <button
      type="button"
      onClick={onActivate}
      className="w-[250px] flex items-center gap-2 px-3 py-1.5 -mb-0.5 text-sm text-content-dimmed bg-transparent border border-surface-outline rounded-lg hover:bg-surface-dimmed transition"
      data-test-id={testId ? `${testId}-activator` : undefined}
    >
      <IconSearch size={14} className="text-content-dimmed" />
      <span className="flex-1 text-left truncate">{placeholder}</span>
      <span className="text-xs">⌘K</span>
    </button>
  );
}
