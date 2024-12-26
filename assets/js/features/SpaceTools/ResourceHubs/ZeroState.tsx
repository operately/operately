import React from "react";

import classNames from "classnames";
import { GhostButton } from "@/components/Buttons";

export function ZeroState() {
  return (
    <div>
      <Examples />
      <ExplanationAndButton />
    </div>
  );
}

function ExplanationAndButton() {
  return (
    <div className="flex flex-col justify-center items-center group">
      <div className="text-base font-bold">Documents &amp; Files</div>

      <div className="flex gap-2 mt-1 mb-4 text-center px-6 text-sm">
        A place to share rich text documents, images, videos, and other files
      </div>

      <GhostButton size="sm">Add a document or file</GhostButton>
    </div>
  );
}

function Examples() {
  return (
    <div className="relative w-full h-[180px] mx-[115px] mt-8 opacity-75">
      <Example
        className="absolute top-2 left-8 rotate-12 group-hover:left-14 group-hover:rotate-[15deg]"
        title="Product Roadmap"
      />
      <Example className="absolute top-0 group-hover:-top-2" title="Monthly Reports" />
      <Example
        className="absolute top-2 -left-8 -rotate-12 group-hover:-left-14 group-hover:rotate-[-15deg]"
        title="Employee Handbook"
      />
    </div>
  );
}

function Example({ title, className }: { title: string; className?: string }) {
  const klass = classNames(
    "absolute bg-surface-base border border-stone-300 dark:border-stone-500 shadow-sm",
    "rounded-sm p-2 h-[140px] w-[100px] overflow-hidden transition-all",
    className,
  );

  return (
    <div className={klass}>
      <div className="font-bold mb-2 text-[9px]" style={{ lineHeight: 1.1 }}>
        {title}
      </div>

      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5 mr-2"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5 mr-6"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5 mr-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5 mr-7"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5 mr-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5 mr-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5 mr-1"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5"></div>
      <div className="border-t border-stone-400 dark:border-stone-500 mt-0.5 pt-0.5 mr-1"></div>
    </div>
  );
}
