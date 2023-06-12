import React from "react";

import { useTranslation } from "react-i18next";
import { useObjectives } from "../../graphql/Objectives";
import Avatar, { AvatarSize } from "../../components/Avatar";

import { Link } from "react-router-dom";

interface Owner {
  id: string;
  fullName: string;
  avatarUrl?: string;
  title: string;
}

interface KeyResult {
  id: string;
  name: string;
  status: string;
  stepsCompleted: number;
  stepsTotal: number;
  updatedAt: string;
}

interface Objective {
  id: string;
  name: string;
  owner?: Owner;
  keyResults: KeyResult[];
}

function Card({ objective }: { objective: Objective }): JSX.Element {
  const path = `/objectives/${objective.id}`;

  return (
    <Link
      to={path}
      className="block mt-2 rounded-lg p-4 bg-white card-shadow hover:card-shadow-blue"
    >
      <div className="flex gap-14 items-center">
        <div className="w-1/3">
          <div className="text-brand-base font-bold">{objective.name}</div>
        </div>

        <div className="w-2/6">
          {objective.owner ? (
            <Champion person={objective.owner} />
          ) : (
            <div className="text-dark-2 text-xs">No owner</div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        {objective.keyResults.map((keyResult) => (
          <div key={keyResult.id} className="flex">
            <div className="w-1/6">{keyResult.status}</div>
            <div className="w-1/6">
              {keyResult.stepsCompleted} out of {keyResult.stepsTotal}
            </div>
            <div className="flex-1">{keyResult.name}</div>
            <div className="w-1/6"></div>
          </div>
        ))}
      </div>
    </Link>
  );
}

function Champion({ person }: { person: Owner }): JSX.Element {
  return (
    <div className="flex gap-2 items-center">
      <Avatar person={person} size={AvatarSize.Small} />
      <div>{person.fullName}</div>
    </div>
  );
}

export default function Objectives({
  groupId,
}: {
  groupId: string;
}): JSX.Element {
  const { t } = useTranslation();

  const { loading, error, data } = useObjectives({ groupId });

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error)
    return (
      <p>
        {t("error.error")}: {error.message}
      </p>
    );

  if (data.objectives.length === 0) return <></>;

  return (
    <div className="mt-4">
      <h2 className="text-lg font-semibold">Objectives</h2>

      {data.objectives.map((project: Objective) => (
        <Card key={project.id} objective={project} />
      ))}
    </div>
  );
}
