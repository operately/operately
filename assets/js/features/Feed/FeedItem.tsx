import * as React from "react";
import { Activity } from "@/api";
import * as People from "@/models/people";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

//
// Every feed item defined in the in the items folder should implement this interface
// and be added to the FeedItems array in index.tsx
//
export interface FeedItem {
  typename: string;
  contentQuery: string;
  component: React.FC<{ activity: Activity; content: any; page: string }>;
}

interface ContainerProps {
  author: People.Person;
  time: any;
  title: JSX.Element | string;
  content?: JSX.Element | string;
}

export function Container({ author, time, title, content }: ContainerProps) {
  const alignement = content ? "items-start" : "items-center";
  const profilePath = Paths.profilePath(author.id);

  return (
    <div className={"flex flex-1 gap-3" + " " + alignement}>
      <DivLink to={profilePath}>
        <Avatar person={author} size="small" />
      </DivLink>

      <div className="flex-1">
        <Title>{title}</Title>
        {content && <Content>{content}</Content>}
      </div>
      <Time time={time} author={author} />
    </div>
  );
}

function Time({ time, author }) {
  return (
    <div className="shrink-0 text-xs text-content-dimmed w-16 text-right">
      <FormattedTime time={time} format="time-only" timezone={author.timezone} />
    </div>
  );
}

function Title({ children }) {
  return <div className="text-sm w-full font-bold text-content-accent">{children}</div>;
}

function Content({ children }) {
  return <div className="text-sm w-full mt-1">{children}</div>;
}
