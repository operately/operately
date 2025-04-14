import * as React from "@types/react";
import { Page } from ".";

export function PageOptions({ options }: { options?: Page.Option[] }) {
  if (!options) {
    return null;
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-end mb-6">
      <div className="flex items-center gap-4">
        {options.map((option, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            {option.icon}
            <span>{option.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
