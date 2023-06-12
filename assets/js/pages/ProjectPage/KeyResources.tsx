import React from "react";

import * as Icons from "tabler-icons-react";

export default function KeyResources(): JSX.Element {
  return (
    <div>
      <div className="mt-8 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 uppercase font-bold tracking-wide">
          KEY RESOURCES
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-shade-1 px-4 py-3 flex items-center gap-2 rounded-lg cursor-pointer">
          <Icons.BrandGithub size={20} className="text-pink-400" />
          GitHub Repository
        </div>

        <div className="bg-shade-1 px-4 py-3 flex items-center gap-2 rounded-lg cursor-pointer">
          <div className="shrink-0">
            <Icons.File size={20} className="text-blue-400" />
          </div>
          CFO Presentation
        </div>

        <div className="border border-shade-3 border-dashed px-4 py-3 flex items-center gap-2 rounded-lg">
          <Icons.Plus size={20} />
          Add Resource
        </div>
      </div>
    </div>
  );
}
