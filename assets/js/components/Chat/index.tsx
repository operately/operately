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
  return <div className="border border-dark-8% rounded-[10px]">{children}</div>;
}

function Header({ author, acknowlegment, time }) {
  return (
    <div className="flex items-center justify-between m-[20px] pb-[20px] border-b border-dark-8%">
      <div className="flex items-center gap-[10px]">
        <Avatar person={author} size={AvatarSize.Small} />
        <div className="font-bold">{author.fullName}</div>
        <span className="text-dark-2">
          posted an update on <FormattedTime time={time} format="short-date" />
        </span>
      </div>

      <div>
        <Icon name="menu dots" size={IconSize.Small} />
      </div>
    </div>
  );
}

function Message({ children }) {
  return (
    <div className="px-[20px]">
      <div className="text-sm tracking-[0.03] text-dark-2 upercase mt-[21px]">
        PROGRESS
      </div>

      <div className="text-dark-1 font-bold mt-[5px] mb-[6px]">
        What has the team accomplished since the last update?
      </div>

      <div className="leading-[24px]">{children}</div>
    </div>
  );
}

function Comments({ children }) {
  return <div className="border-t border-dark-8% m-[20px]">{children}</div>;
}

function Comment({ author, time, children }) {
  return (
    <div className="my-[20px]">
      <div className="flex items-center gap-5">
        <Avatar person={author} size={AvatarSize.Small} />
        <div className="font-bold">{author.fullName}</div>
        <FormattedTime time={time} format="relative" />
      </div>

      <div className="ml-[50px]">{children}</div>
    </div>
  );
}

export { Container, Header, Message, Comments, Comment };
