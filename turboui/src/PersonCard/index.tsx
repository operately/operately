import React from "react";
import { useLocation } from "react-router-dom";

import classNames from "../utils/classnames";
import { AvatarWithName } from "../Avatar";
import { DivLink } from "../Link";

export namespace PersonCard {
  export interface Person {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    title: string;
    profileLink: string;
  }

  export interface Props {
    person: Person;
    highlight?: boolean;
    link?: boolean;

    connectLeft?: boolean;
    connectRight?: boolean;
    connectUp?: boolean;
    connectUpJoinLeft?: boolean;
    connectColor?: string;
  }
}

export function PersonCard(props: PersonCard.Props) {
  const { person, highlight, link } = props;
  const location = useLocation();

  const className = classNames("flex items-center gap-2 text-sm rounded-xl px-4 py-3 bg-surface-dimmed", "relative", {
    "border-2 border-brand-1": highlight,
    "border-2 border-stroke-base": !highlight,
    "cursor-pointer": !link,
  });

  const content = (
    <>
      <AvatarWithName
        person={person}
        size={36}
        textSize="small"
        nameFormat="full"
        className="font-semibold"
        title={person.title}
      />

      <ConnectionLines {...props} />
    </>
  );

  const testid = `person-card-${person.id}`;

  // Preserve query parameters when navigating
  const getLinkWithParams = () => {
    if (typeof window === "undefined") return person.profileLink; // Handle SSR

    try {
      const currentSearchParams = new URLSearchParams(location.search);

      const url = new URL(person.profileLink, window.location.origin);
      const targetSearchParams = new URLSearchParams(url.search);

      currentSearchParams.forEach((value, key) => {
        if (!targetSearchParams.has(key)) {
          targetSearchParams.append(key, value);
        }
      });

      url.search = targetSearchParams.toString();

      return url.pathname + url.search;
    } catch (e) {
      return person.profileLink;
    }
  };

  if (link) {
    return <DivLink to={getLinkWithParams()} className={className} children={content} testId={testid} />;
  } else {
    return <div className={className} children={content} data-test-id={testid} />;
  }
}

function ConnectionLines(props: PersonCard.Props) {
  const connectColor = props.connectColor || "border-accent-1";

  return (
    <>
      {props.connectUp && (
        <div
          className={classNames(
            "absolute border-b-2 border-l-2 rounded-bl-lg",
            "transform -translate-y-1/2",
            connectColor,
          )}
          style={{
            left: "-10px",
            width: "10px",
            height: props.connectUpJoinLeft ? "100%" : "calc(100% + 20px)",
          }}
        />
      )}

      {props.connectUp && props.connectUpJoinLeft && (
        <div
          className={classNames("absolute border-t-2 border-r-2 rounded-tr-lg", connectColor)}
          style={{
            width: "10px",
            height: "20px",
            left: "-18px",
            top: "calc(-100% + 17px)",
          }}
        />
      )}

      {props.connectLeft && (
        <div
          className={classNames(
            "absolute top-1/2 -left-5 w-5 border-t-2",
            "transform -translate-y-1/2",
            "z-[1]",
            connectColor,
          )}
        />
      )}

      {props.connectRight && (
        <div
          className={classNames(
            "absolute top-1/2 -right-5 w-5 border-t-2",
            "transform -translate-y-1/2",
            "z-[1]",
            connectColor,
          )}
        />
      )}
    </>
  );
}
