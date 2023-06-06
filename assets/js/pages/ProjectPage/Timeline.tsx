import React from "react";

import * as Icons from "tabler-icons-react";

import FormattedTime from "@/components/FormattedTime";

export default function Timeline({ project }) {
  return (
    <div>
      <div className="py-4 -mx-8 px-8 pb-10 pt-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-4 py-4 bg-shade-1 rounded-lg border border-shade-2">
            <div className="flex items-center gap-2">
              <Icons.Circle size={20} className="text-green-400" /> Created
            </div>

            <div className="flex items-center gap-2">
              <FormattedTime time={project.deadline} format="short-date" />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-4 bg-shade-1 rounded-lg border border-shade-2">
            <div className="flex items-center gap-2">
              <Icons.BoxPadding size={20} className="text-green-400" /> Concept
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-4 bg-shade-1 rounded-lg border border-shade-2">
            <Icons.Route size={20} className="text-green-400" /> Planning
          </div>

          <div className="flex items-center gap-2 px-4 py-4 bg-shade-1 rounded-lg border border-shade-2">
            <Icons.Hammer size={20} className="text-green-400" /> Execution
          </div>

          <div className="flex items-center gap-2 px-4 py-4 bg-shade-1 rounded-lg border border-shade-2">
            <Icons.ListCheck size={20} className="text-white-2" /> Closing
          </div>

          <div className="flex items-center gap-2 px-4 py-4 bg-shade-1 rounded-lg border border-shade-2">
            <Icons.CircleCheck size={20} className="text-white-2" /> Closed
          </div>
        </div>
      </div>
    </div>
  );
}
