import React from "react";

import Forms from "@/components/Forms";

import { useLoadedData } from "./loader";
import { Title } from "./components";
import { AvatarLink } from "@/components/Avatar";
import { useIsViewMode } from "@/components/Pages";

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
      <div className="flex items-center gap-1.5 -mt-2">
        <AvatarLink person={person} size={20} className="mt-2" /> {person.fullName}
      </div>
    </div>
  );
}
