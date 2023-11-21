import * as React from "react";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import * as People from "@/models/people";

interface ContainerProps {
  author: People.Person;
  time: any;
  title: JSX.Element | string;
  content?: JSX.Element | string;
}

export function Container({ author, time, title, content }: ContainerProps) {
  const alignement = content ? "items-start" : "items-center";

  return (
    <div className="flex w-full">
      <div className="w-full pr-2 pb-6">
        <div className={"flex gap-3" + " " + alignement}>
          <Avatar person={author} size="small" />
          <div className="flex-1">
            <Title>{title}</Title>
            {content && <Content>{content}</Content>}
          </div>
          <Time time={time} />
        </div>
      </div>
    </div>
  );
}

function Time({ time }) {
  return (
    <div className="shrink-0 text-xs text-content-dimmed w-16 text-right">
      <FormattedTime time={time} format="time-only" />
    </div>
  );
}

function Title({ children }) {
  return <div className="text-sm w-full font-bold text-content-accent">{children}</div>;
}

function Content({ children }) {
  return <div className="text-sm w-full mt-1">{children}</div>;
}
