import * as React from "react";
import * as People from "@/models/people";

import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { FilledButton } from "@/components/Button";

import Avatar from "@/components/Avatar";
import classNames from "classnames";

export function Colleagues({ person }: { person: People.Person }) {
  const [allPeersVisible, setAllPeersVisible] = React.useState(false);
  const [allReportsVisible, setAllReportsVisible] = React.useState(false);

  const sortedPeers = person.peers!.slice().sort((a, b) => a!.fullName.localeCompare(b!.fullName));
  const sortedReports = person.reports!.slice().sort((a, b) => a!.fullName.localeCompare(b!.fullName));

  const visiblePeers = allPeersVisible ? sortedPeers : sortedPeers.slice(0, 4);
  const visibleReports = allReportsVisible ? sortedReports : sortedReports.slice(0, 4);

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

          <div className="flex flex-col gap-2">
            <PersonCard
              person={person!}
              highlight
              connectLeft={!!person.manager}
              connectRight={person.reports!.length > 0}
            />

            {visiblePeers.map((peer, index) => (
              <PersonCard
                key={peer!.id}
                person={peer!}
                link
                connectUp={!!person.manager}
                connectUpJoinLeft={index === 0}
                connectColor="border-surface-outline"
              />
            ))}
          </div>

          {!allPeersVisible && person.peers!.length > visiblePeers.length && (
            <div className="mt-2 flex items-center justify-center">
              <FilledButton type="secondary" size="xxs" onClick={() => setAllPeersVisible(true)}>
                Show all
              </FilledButton>
            </div>
          )}
        </div>

        {visibleReports.length > 0 && (
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

            {!allReportsVisible && person.reports!.length > visibleReports.length && (
              <div className="mt-2 flex items-center justify-center">
                <FilledButton type="secondary" size="xxs" onClick={() => setAllReportsVisible(true)}>
                  Show all
                </FilledButton>
              </div>
            )}
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

      <ConnectionLines props={props} />
    </>
  );

  const testid = `person-card-${person.id}`;

  if (link) {
    return <DivLink to={Paths.profilePath(person.id)} className={className} children={content} testId={testid} />;
  } else {
    return <div className={className} children={content} data-test-id={testid} />;
  }
}

function ConnectionLines({ props }: { props: PersonCardProps }) {
  const connectColor = props.connectColor || "border-accent-1";

  return (
    <>
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
