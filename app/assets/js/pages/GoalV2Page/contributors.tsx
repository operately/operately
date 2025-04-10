import React from "react";

import Forms from "@/components/Forms";
import { AvatarLink } from "@/components/AvatarLink";
import { useIsViewMode } from "@/components/Pages";
import plurarize from "@/utils/plurarize";
import { AvatarList } from "turboui";

import { useLoadedData } from "./loader";
import { DisableInEditMode, Title } from "./components";

export function Contributors() {
  const { contributors } = useLoadedData();
  const text = plurarize(contributors.length, "person", "people");

  if (contributors.length < 1) return null;

  return (
    <DisableInEditMode>
      <Title title="Contributors" />
      <AvatarList people={contributors} size="tiny" maxElements={20} />
      <div className="text-xs text-content-dimmed mt-2">
        {text} contributed by working on related projects and sub-goals
      </div>
    </DisableInEditMode>
  );
}

export function Champion() {
  const { goal } = useLoadedData();
  const isViewMode = useIsViewMode();

  if (isViewMode) return <ReadonlyPerson label="Champion" person={goal.champion} />;

  return (
    <div>
      <Title title="Champion" />
      <Forms.FieldGroup>
        <Forms.SelectPerson field="champion" default={goal.champion} />
      </Forms.FieldGroup>
    </div>
  );
}

export function Reviewer() {
  const { goal } = useLoadedData();
  const isViewMode = useIsViewMode();

  if (isViewMode) return <ReadonlyPerson label="Reviewer" person={goal.reviewer} />;

  return (
    <div>
      <Title title="Reviewer" />
      <Forms.FieldGroup>
        <Forms.SelectPerson field="reviewer" default={goal.reviewer} />
      </Forms.FieldGroup>
    </div>
  );
}

function ReadonlyPerson({ label, person }) {
  return (
    <div>
      <Title title={label} />
      <div className="text-sm flex items-center gap-1.5 -mt-1">
        <AvatarLink person={person} size={20} className="mt-2" /> {person.fullName}
      </div>
    </div>
  );
}
