import * as React from "react";
import * as People from "@/models/people";

import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

import Avatar from "@/components/Avatar";
import classNames from "classnames";

export function Colleagues({ person }: { person: People.Person }) {
  return (
    <div className="py-6">
      <div className="text-xs mb-2 uppercase font-bold">Colleagues</div>

      <div className="grid grid-cols-3 gap-4">
        {person.manager && (
          <div>
            <div className="text-xs font-medium text-content-dimmed mb-2">Manager</div>
            <PersonCard person={person.manager!} link />
          </div>
        )}

        <div>
          <div className="text-xs font-medium text-content-dimmed mb-2">Peers</div>
          <PersonCard
            person={person!}
            highlight
            connectLeft={!!person.manager}
            connectRight={person.reports!.length > 0}
          />
        </div>

        {person.reports!.length > 0 && (
          <div>
            <div className="text-xs font-medium text-content-dimmed mb-2">Reports</div>

            <div className="flex flex-col gap-2">
              {person.reports!.map((person, index) => (
                <PersonCard
                  key={person!.id}
                  person={person!}
                  link
                  connectUp={index > 0}
                  connectUpJoinLeft={index === 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PersonCardProps {
  person: People.Person;
  highlight?: boolean;
  link?: boolean;

  connectLeft?: boolean;
  connectRight?: boolean;
  connectUp?: boolean;
  connectUpJoinLeft?: boolean;
  connectColor?: string;
}

function PersonCard(props: PersonCardProps) {
  const { person, highlight, link } = props;

  const connectColor = props.connectColor || "border-accent-1";

  const className = classNames("flex items-center gap-2 text-sm rounded-xl px-4 py-3 bg-surface-dimmed", "relative", {
    "border-2 border-accent-1": highlight,
    "border-2 border-stroke-base": !highlight,
    "cursor-pointer": !link,
  });

  const content = (
    <>
      <Avatar person={person} size={36} />
      <div className="truncate">
        <div className="font-semibold">{person.fullName}</div>
        <div className="text-xs truncate">{person.title}</div>
      </div>

      {props.connectLeft && (
        <div
          className={classNames("absolute top-1/2 -left-5 w-5 border-t-2", "transform -translate-y-1/2", connectColor)}
        />
      )}

      {props.connectRight && (
        <div
          className={classNames("absolute top-1/2 -right-5 w-5 border-t-2", "transform -translate-y-1/2", connectColor)}
        />
      )}

      {props.connectUp && (
        <div
          className={classNames(
            "absolute border-b-2 border-l-2 rounded-bl-lg botom-10",
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

      {props.connectUpJoinLeft && (
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
    </>
  );

  if (link) {
    return <DivLink to={Paths.profilePath(person.id)} className={className} children={content} />;
  } else {
    return <div className={className} children={content} />;
  }
}
