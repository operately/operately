import React from "react";

import { SecondaryButton } from "../../Button";
import { PersonCard } from "../../PersonCard";

import { ProfilePage } from "..";

export function Colleagues(props: ProfilePage.Props) {
  const [allPeersVisible, setAllPeersVisible] = React.useState(false);
  const [allReportsVisible, setAllReportsVisible] = React.useState(false);

  const visiblePeers = allPeersVisible ? props.peers : props.peers.slice(0, 4);
  const visibleReports = allReportsVisible ? props.reports : props.reports.slice(0, 4);
  const hasManager = !!props.manager;

  return (
    <div className="py-6">
      <div className="text-xs mb-2 uppercase font-bold">Colleagues</div>

      <div className="grid grid-cols-3 gap-4">
        {props.manager && (
          <div>
            <div className="text-xs font-medium text-content-dimmed mb-2">Manager</div>
            <PersonCard person={props.manager} link />
          </div>
        )}

        <div>
          <div className="text-xs font-medium text-content-dimmed mb-2">Peers</div>

          <div className="flex flex-col gap-2">
            <PersonCard
              person={props.person}
              highlight
              connectLeft={hasManager}
              connectRight={props.reports.length > 0}
            />

            {visiblePeers.map((peer, index) => (
              <PersonCard
                key={peer!.id}
                person={peer!}
                link
                connectUp={hasManager}
                connectUpJoinLeft={index === 0}
                connectColor="border-surface-outline"
              />
            ))}
          </div>

          {!allPeersVisible && props.peers.length > visiblePeers.length && (
            <div className="mt-2 flex items-center justify-center">
              <SecondaryButton size="xxs" onClick={() => setAllPeersVisible(true)}>
                Show all
              </SecondaryButton>
            </div>
          )}
        </div>

        {visibleReports.length > 0 && (
          <div>
            <div className="text-xs font-medium text-content-dimmed mb-2">Reports</div>

            <div className="flex flex-col gap-2">
              {visibleReports.map((person, index) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  link
                  connectUp={index > 0}
                  connectUpJoinLeft={index === 1}
                />
              ))}
            </div>

            {!allReportsVisible && props.reports.length > visibleReports.length && (
              <div className="mt-2 flex items-center justify-center">
                <SecondaryButton size="xxs" onClick={() => setAllReportsVisible(true)}>
                  Show all
                </SecondaryButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
