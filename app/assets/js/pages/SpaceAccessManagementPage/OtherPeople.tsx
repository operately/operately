import * as React from "react";
import * as People from "@/models/people";
import { useTranslation } from "react-i18next";
import { tn, translationText } from "@/i18n";

import { PermissionLevels } from "@/features/Permissions";
import { ActionLink, Avatar, PageSection } from "turboui";

import { SpaceAccessLevelBadge } from "@/components/Badges/AccessLevelBadges";
import { useBindedPeopleList } from "./loader";

export function OtherPeople() {
  const [show, setShow] = React.useState(false);

  const { people, loading } = useBindedPeopleList();

  if (loading) return null;
  if (!people || people.length === 0) return null;

  if (show) {
    return <Expanded people={people} />;
  } else {
    return <Condensed people={people} onShowAllClick={() => setShow(true)} />;
  }
}

function Expanded({ people }: { people: People.Person[] }) {
  const { t } = useTranslation();
  const groups = groupPeopleByAccessLevel(people);

  return (
    <PageSection
      title={t("Other People with Access")}
      subtitle={translationText(t("People who have access to the space via their company membeship."))}
      testId="other-people-list"
    >
      {groups.map((group) => (
        <OtherPeopleGroup accessLevel={group.accessLevel} people={group.people} key={group.accessLevel} />
      ))}
    </PageSection>
  );
}

function Condensed({ people, onShowAllClick }: { people: People.Person[]; onShowAllClick: () => void }) {
  const { t } = useTranslation();
  const message = tn("1 other person has access to this space", "{{count}} other people have access to this space", people.length);

  const testId = "show-all-other-people";
  const showAll = (
    <ActionLink onClick={onShowAllClick} testId={testId}>
        {t("show all")}
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
        <SpaceAccessLevelBadge accessLevel={accessLevel} />
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
      <div className="font-medium flex items-center gap-2">{person.fullName}</div>
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
