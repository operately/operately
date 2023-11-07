import * as React from "react";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

interface ContainerProps {
  author: any;
  time: any;
  title: string;
  content?: string;
}

export function Container({ author, time, title, content }: ContainerProps) {
  return (
    <div className="flex w-full">
      <div className="w-full pr-2 py-3">
        <div className="flex items-start gap-3">
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
    <div className="shrink-0 text-xs text-white-2 mt-2 w-12 text-right">
      <FormattedTime time={time} format="time-only" />
    </div>
  );
}

function Title({ children }) {
  return <div className="text-sm w-full font-bold text-white-1">{children}</div>;
}

export function Content({ children }) {
  return <div className="text-sm w-full mt-1">{children}</div>;
}
