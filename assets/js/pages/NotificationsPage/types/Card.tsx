import * as React from "react";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { TextSeparator } from "@/components/TextSeparator";

export function Card({ author, title, link, where, when, who }) {
  const goToActivity = useNavigateTo(link);

  return (
    <div
      className="flex items-center gap-3 hover:bg-shade-1 rounded p-1 group transition-all duration-100 cursor-pointer mb-1"
      onClick={goToActivity}
    >
      <div className="shrink-0">
        <Avatar person={author} size={36} />
      </div>

      <div className="flex-1">
        <div className="text-white-1 font-semibold">{title}</div>
        <div className="text-white-2 text-sm leading-snug">
          {where}
          <TextSeparator />
          {who}
          <TextSeparator />
          <FormattedTime time={when} format="long-date" />
        </div>
      </div>

      <div className="shrink-0 group-hover:opacity-100 opacity-0 cursor-pointer mb-4 mr-1">
        <Icons.IconX size={16} className="hover:text-white-1" />
      </div>
    </div>
  );
}
