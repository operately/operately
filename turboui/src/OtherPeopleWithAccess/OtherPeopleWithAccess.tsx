import React from "react";

import { AccessLevelBadge } from "../AccessLevelBadge";
import { Avatar } from "../Avatar";
import { TestableElement } from "../TestableElement";

export namespace OtherPeopleWithAccess {
  export interface Person {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    accessLevel: number;
  }

  export interface Props extends TestableElement {
    people: Person[];
    loading?: boolean;
    /** When false, hide the heading (e.g. inside a modal that already has a title). Description still shows. */
    showTitle?: boolean;
  }
}

type PeopleGroup = { accessLevel: number; people: OtherPeopleWithAccess.Person[] };

export function OtherPeopleWithAccess({
  people,
  loading = false,
  showTitle = true,
  testId = "other-people-list",
}: OtherPeopleWithAccess.Props) {
  if (loading) {
    return <OtherPeopleWithAccessSkeleton showTitle={showTitle} />;
  }

  if (people.length === 0) {
    return (
      <div>
        <Header showTitle={showTitle} />
        <p className="text-sm text-content-dimmed">
          No one else has access beyond people already assigned to this project.
        </p>
      </div>
    );
  }

  const groups = groupPeopleByAccessLevel(people);

  return (
    <div>
      <Header showTitle={showTitle} />

      <div data-test-id={testId}>
        {groups.map((group) => (
          <OtherPeopleGroup accessLevel={group.accessLevel} people={group.people} key={group.accessLevel} />
        ))}
      </div>
    </div>
  );
}

function Header({ showTitle }: { showTitle: boolean }) {
  return (
    <>
      {showTitle && <div className="font-bold text-lg">Other People with Access</div>}
      <div className={`text-medium text-sm max-w-lg mb-6 ${showTitle ? "mt-1" : ""}`}>
        People who have access to the project based on their company or space membership but are not directly assigned
        to the project.
      </div>
    </>
  );
}

function OtherPeopleGroup({ accessLevel, people }: { accessLevel: number; people: OtherPeopleWithAccess.Person[] }) {
  return (
    <div className="border-t border-stroke-dimmed py-4 first:border-t-0 first:pt-0">
      <div className="mb-3">
        <AccessLevelBadge accessLevel={accessLevel} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {people.map((person) => (
          <div className="flex items-center gap-2 min-w-0" key={person.id}>
            <Avatar person={person} size={20} />
            <div className="font-medium truncate">{person.fullName}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OtherPeopleWithAccessSkeleton({ showTitle }: { showTitle: boolean }) {
  return (
    <div>
      <Header showTitle={showTitle} />
      <div className="animate-pulse" data-test-id="other-people-with-access-skeleton">
        <SkeletonGroup />
        <SkeletonGroup />
      </div>
    </div>
  );
}

function SkeletonGroup() {
  return (
    <div className="border-t border-stroke-dimmed py-4 first:border-t-0 first:pt-0">
      <div className="mb-3 h-6 w-24 rounded-full bg-surface-dimmed" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="flex items-center gap-2" key={index}>
            <div className="h-5 w-5 shrink-0 rounded-full bg-surface-dimmed" />
            <div className="h-4 w-24 rounded bg-surface-dimmed" />
          </div>
        ))}
      </div>
    </div>
  );
}

function groupPeopleByAccessLevel(people: OtherPeopleWithAccess.Person[]): PeopleGroup[] {
  const groups = people.reduce((acc, person) => {
    const group = acc.find((g) => g.accessLevel === person.accessLevel);

    if (group) {
      group.people.push(person);
    } else {
      acc.push({ accessLevel: person.accessLevel, people: [person] });
    }

    return acc;
  }, [] as PeopleGroup[]);

  return groups.sort((a, b) => b.accessLevel - a.accessLevel);
}

export type OtherPeopleWithAccessPerson = OtherPeopleWithAccess.Person;
