import * as React from "react";
import * as People from "@/models/people";

import { ProjectAccessLevelBadge } from "@/components/Badges/AccessLevelBadges";
import { PermissionLevels } from "@/features/Permissions";
import { ActionLink } from "@/components/Link";
import { useBindedPeopleList } from "./loader";

import Avatar from "@/components/Avatar";
import { match } from "ts-pattern";

export function OtherPeople() {
  const [show, setShow] = React.useState(false);

  const { people, loading } = useBindedPeopleList();

  if (loading) return null;
  if (people!.length === 0) return null;

  if (show) {
    return <Expanded people={people!} />;
  } else {
    return <Condensed people={people!} onShowAllClick={() => setShow(true)} />;
  }
}

function Expanded({ people }: { people: People.Person[] }) {
  const groups = groupPeopleByAccessLevel(people!);

  return (
    <div>
      <div className="font-bold mt-10 text-lg">Other People with Access</div>
      <div className="text-medium text-sm max-w-lg mb-6">
        People who have access to the project based on their company or space membership but are not directly assigned
        to the project.
      </div>

      <div data-test-id="other-people-list">
        {groups.map((group) => (
          <OtherPeopleGroup accessLevel={group.accessLevel} people={group.people} key={group.accessLevel} />
        ))}
      </div>
    </div>
  );
}

function Condensed({ people, onShowAllClick }: { people: People.Person[]; onShowAllClick: () => void }) {
  const message = match(people.length)
    .with(1, () => "1 other person has access to this project")
    .otherwise(() => `${people.length} other people have access to this project`);

  const testId = "show-all-other-people";
  const showAll = (
    <ActionLink onClick={onShowAllClick} testId={testId}>
      show all
    </ActionLink>
  );

  return (
    <div className="mt-12 text-center">
      <div className="text-sm mb-2">
        {message} ({showAll})
      </div>
    </div>
  );
}

function OtherPeopleGroup({ accessLevel, people }: { accessLevel: PermissionLevels; people?: People.Person[] }) {
  if (!people) return null;
  if (people.length === 0) return null;

  return (
    <div className="flex items-start gap-10 border-t border-stroke-dimmed py-3">
      <p className="shrink-0 w-36">
        <ProjectAccessLevelBadge accessLevel={accessLevel} />
      </p>

      <div className="flex items-center gap-2 flex-wrap mt-0.5">
        <OtherPeopleAvatarList people={people} />
      </div>
    </div>
  );
}

function OtherPeopleAvatarList({ people }: { people: People.Person[] }) {
  return people.map((person) => (
    <div className="flex items-center gap-2" key={person.id}>
      <Avatar person={person} size={20} />
      <div className="font-medium flex items-center gap-2">{person!.fullName}</div>
    </div>
  ));
}

type PeopleGroup = { accessLevel: PermissionLevels; people: People.Person[] };

function groupPeopleByAccessLevel(people: People.Person[]): PeopleGroup[] {
  const res = people.reduce((acc, person) => {
    const accessLevel = person.accessLevel as PermissionLevels;
    const group = acc.find((group) => group.accessLevel === accessLevel);

    if (group) {
      group.people.push(person);
    } else {
      acc.push({ accessLevel, people: [person] });
    }

    return acc;
  }, [] as PeopleGroup[]);

  return res.sort((a, b) => b.accessLevel - a.accessLevel);
}
