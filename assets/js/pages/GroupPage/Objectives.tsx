import React from 'react';

import { useTranslation } from 'react-i18next';
import { useObjectives } from '../../graphql/Objectives';
import Avatar, {AvatarSize} from '../../components/Avatar';

import { Link } from "react-router-dom";

function CardListHeader({headers} : {headers: Array<{id: string, label: string}>}) : JSX.Element {
  return <div className="flex gap-14 mt-4 px-2">
    {headers.map((header) =>
      <div key={header.id} className="w-1/4 text-xs text-dark-2">{header.label}</div>
    )}
  </div>;
}

interface Owner {
  id: string;
  fullName: string;
  avatarUrl?: string;
  title: string;
}

interface Objective {
  id: string;
  name: string;
  owner?: Owner;
}

function Card({objective} : {objective: Objective}) : JSX.Element {
  return <Link to={`/objectives/` + objective.id} className="flex gap-14 mt-2 rounded-lg p-4 bg-white items-center card-shadow hover:card-shadow-blue">
    <div className="w-1/3">
      <div className="text-brand-base font-bold">{objective.name}</div>
    </div>

    <div className="w-2/6">
      {objective.owner
        ? <Champion person={objective.owner} />
        : <div className="text-dark-2 text-xs">No owner</div>
      }
    </div>
  </Link>;
}

function Champion({person} : {person: Owner}) : JSX.Element {
  return (
    <div className="flex gap-2 items-center">
      <Avatar person={person} size={AvatarSize.Small} />
      <div>{person.fullName}</div>
    </div>
  );
}

export default function Objectives({groupId} : {groupId: string}) : JSX.Element {
  const { t } = useTranslation();

  const { loading, error, data } = useObjectives({groupId});

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error) return <p>{t("error.error")}: {error.message}</p>;

  if (data.objectives.length === 0) return <></>;

  return <div className="mt-4">
    <h2 className="text-lg font-semibold">Objectives</h2>

    {data.objectives.map((project : Objective) =>
      <Card key={project.id} objective={project} />
    )}
  </div>;
}
