import React from "react";
import * as Icons from "tabler-icons-react";

export default function Tabs() {
  return (
    <div className="flex items-center -mx-8 border-b border-shade-2">
      <div className="font-bold flex items-center gap-2 border-b-2 border-white-2 -mb-[1px] px-4 py-4">
        <Icons.LayoutCollage size={20} className="text-pink-400" />
        Overview
      </div>

      <div className="font-bold flex items-center gap-2 border-b-2 border-transparent -mb-[1px] px-4 py-4 text-white-2">
        <Icons.Map2 size={20} />
        Timeline
      </div>

      <div className="font-bold flex items-center gap-2 border-b-2 border-transparent -mb-[1px] px-4 py-4 text-white-2">
        <Icons.Users size={20} />
        Contributors
      </div>
    </div>
  );
}
