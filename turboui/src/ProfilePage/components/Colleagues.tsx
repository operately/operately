import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { PersonCard } from "../../PersonCard";
import { SecondaryButton } from "../../Button";
import classNames from "../../utils/classnames";

import { ProfilePage } from "..";

export function Colleagues(props: ProfilePage.Props) {
  const [allPeersVisible, setAllPeersVisible] = React.useState(false);
  const [allReportsVisible, setAllReportsVisible] = React.useState(false);
  const location = useLocation();
  const mainPersonRef = useRef<HTMLDivElement>(null);

  const visiblePeers = allPeersVisible ? props.peers : props.peers.slice(0, 4);
  const visibleReports = allReportsVisible ? props.reports : props.reports.slice(0, 4);
  const hasManager = !!props.manager;
  const hasReportsColumn = visibleReports.length > 0;

  // Scroll to the main person's card when the page loads or URL changes
  useEffect(() => {
    if (mainPersonRef.current) {
      setTimeout(() => {
        mainPersonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100); // Small delay to ensure the DOM is fully rendered
    }
  }, [location.pathname]);

  return (
    <div className="py-6">
      <div className="text-xs mb-2 uppercase font-bold">Colleagues</div>

      <div className="overflow-x-auto">
        <div className={getGridColumnsClass(hasManager, hasReportsColumn)}>
          {hasManager && (
            <div className="w-full">
              <div className="text-xs font-medium text-content-dimmed mb-2">Manager</div>
              <PersonCard person={props.manager!} link />
            </div>
          )}

          <div className="w-full">
            <div className="text-xs font-medium text-content-dimmed mb-2">Peers</div>

            <div className="flex flex-col gap-2 w-full">
              <div ref={mainPersonRef}>
                <PersonCard
                  person={props.person}
                  highlight
                  connectLeft={hasManager}
                  connectRight={props.reports.length > 0}
                />
              </div>

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

          {hasReportsColumn && (
            <div className="w-full">
              <div className="text-xs font-medium text-content-dimmed mb-2">Reports</div>

              <div className="flex flex-col gap-2 w-full">
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
    </div>
  );
}

function getGridColumnsClass(hasManager: boolean, hasReports: boolean): string {
  return classNames("inline-grid gap-4 min-w-max", {
    "grid-cols-1": !hasManager && !hasReports,
    "grid-cols-2": (hasManager && !hasReports) || (!hasManager && hasReports),
    "grid-cols-3": hasManager && hasReports,
  });
}
