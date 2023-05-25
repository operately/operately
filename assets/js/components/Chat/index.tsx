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
import Icon from "@/components/Icon";

function Container({ children }) {
  return <div className="border border-dark-8% rounded-[10px]">{children}</div>;
}

function AckBadge({ person }): JSX.Element {
  return (
    <div
      className="bg-success-2 border border-success-1 flex items-center"
      style={{
        gap: "4px",
        borderRadius: "20px",
      }}
    >
      <div className="ml-[12px] mr-[3px]">
        <svg
          width="18"
          height="19"
          viewBox="0 0 18 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.25 9.31836L9 13.0684L16.5 5.56836M1.5 9.31836L5.25 13.0684M9 9.31836L12.75 5.56836"
            stroke="#548B53"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <div className="border border-success-1 rounded-full overflow-hidden -m-[1px]">
        <Avatar person={person} size={AvatarSize.Small} />
      </div>
    </div>
  );
}

function Header({ author, acknowledgingPerson, time }) {
  return (
    <div className="flex items-center justify-between m-[20px] pb-[19px] border-b border-dark-8%">
      <div className="flex items-center gap-[10px]">
        <Avatar person={author} size={AvatarSize.Small} />
        <div className="flex items-center gap-[4px]">
          <div className="font-bold">{author.fullName}</div>
          <span className="text-dark-2">
            posted an update on{" "}
            <FormattedTime time={time} format="short-date" />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-[10px]">
        {acknowledgingPerson && <AckBadge person={acknowledgingPerson} />}
        <Icon name="menu dots" size="base" />
      </div>
    </div>
  );
}

function Message({ children }) {
  return (
    <div className="px-[20px]">
      <div className="text-sm tracking-[0.3px] text-dark-2 upercase mt-[20px]">
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
      <div className="flex items-center gap-[11px]">
        <Avatar person={author} size={AvatarSize.Small} />

        <div className="flex items-center gap-[5px]">
          <div className="font-bold">{author.fullName}</div>
          <span className="text-dark-2">
            posted a comment <FormattedTime time={time} format="relative" />
          </span>
        </div>
      </div>

      <div className="ml-[40px]">{children}</div>
    </div>
  );
}

export { Container, Header, Message, Comments, Comment };
