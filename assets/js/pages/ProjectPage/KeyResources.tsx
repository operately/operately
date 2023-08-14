import React from "react";

import * as Icons from "@tabler/icons-react";

export default function KeyResources(): JSX.Element {
  return (
    <div className="flex flex-col gap-1 mb-8 border-b border-dark-5 py-4 relative">
      <div className="font-bold flex justify-between items-center mb-1">Key Resources</div>

      <div className="flex gap-2 flex-wrap">
        <Link type="github" href="https://github.com/operately/operately" title="Code Repository" />
      </div>
    </div>
  );
}

function Link({ type, href, title }) {
  return (
    <a
      href={href}
      target="_blank"
      className="font-medium bg-shade-1 px-3 py-2 flex items-center gap-2 rounded-lg cursor-pointer text-sm"
    >
      <LinkIcon type={type} />
      {title}
    </a>
  );
}

function LinkIcon({ type }) {
  switch (type) {
    case "github":
      return <Icons.IconBrandGithub size={20} className="text-pink-400" />;
    default:
      return <Icons.IconLink size={20} className="text-pink-400" />;
  }
}
