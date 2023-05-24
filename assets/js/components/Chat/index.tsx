/*
 * Creates primitives for the communication flow in the application.
 * The supported primitives are:
 *
 * - messages
 * - comments
 * - acknowledgements
 * - reactions
 */

import React from "react";
import Avatar, { AvatarSize } from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

function Container({ children }) {
  return (
    <div className="border border-dark-8% rounded-[10px] p-[1px]">
      {children}
    </div>
  );
}

function Header({ author, acknowlegment, time }) {
  return (
    <div className="flex items-center gap-[10px] m-[20px] pb-[20px] border-b border-dark-8%">
      <Avatar person={author} size={AvatarSize.Small} />
      <div className="font-bold">{author.fullName}</div>
      <span className="text-dark-2">
        posted an update on <FormattedTime time={time} format="short-date" />
      </span>
    </div>
  );
}

function Message({ children }) {
  return <div>{children}</div>;
}

export { Container, Header, Message };
