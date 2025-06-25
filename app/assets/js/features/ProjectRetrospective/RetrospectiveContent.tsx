import React from "react";

import { ProjectRetrospective } from "@/models/projects";
import RichContent, { shortenContent } from "@/components/RichContent";
import classNames from "classnames";

interface Props {
  retrospective: ProjectRetrospective;
  size?: "std" | "sm";
  limit?: number;
}

export function RetrospectiveContent({ retrospective, limit, size = "std" }: Props) {
  const retro = JSON.parse(retrospective.content!);

  const maybeShorten = (content: string) => {
    if (limit) {
      return shortenContent(content, limit, { suffix: "..." });
    }
    return content;
  };

  const contentClass = classNames({
    "text-sm": size === "sm",
  });

  // Check if this is the old format with three separate sections
  const isOldFormat = retro.whatWentWell && retro.whatCouldHaveGoneBetter && retro.whatDidYouLearn;
  
  if (isOldFormat) {
    const whatWentWell = JSON.stringify(retro.whatWentWell);
    const whatCouldHaveGoneBetter = JSON.stringify(retro.whatCouldHaveGoneBetter);
    const whatDidYouLearn = JSON.stringify(retro.whatDidYouLearn);
    
    return (
      <div className="mb-8">
        <QuestionTitle title="What went well?" size={size} />
        <RichContent jsonContent={maybeShorten(whatWentWell)} className={contentClass} />

        <QuestionTitle title="What could've gone better?" size={size} />
        <RichContent jsonContent={maybeShorten(whatCouldHaveGoneBetter)} className={contentClass} />

        <QuestionTitle title="What did you learn?" size={size} />
        <RichContent jsonContent={maybeShorten(whatDidYouLearn)} className={contentClass} />
      </div>
    );
  } else {
    const content = JSON.stringify(retro);
    return (
      <div className="my-8">
        <RichContent jsonContent={maybeShorten(content)} className={contentClass} />
      </div>
    );
  }
}

function QuestionTitle({ title, size }: { title: string; size: "std" | "sm" }) {
  const titleClass = classNames("text-content-accent font-extrabold mb-2 mt-8", {
    "text-base": size === "sm",
    "text-xl": size === "std",
  });

  return <div className={titleClass}>{title}</div>;
}
