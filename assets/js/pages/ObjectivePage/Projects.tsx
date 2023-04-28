import React from 'react';
import { useTranslation } from 'react-i18next';
import { useProjects } from '../../graphql/Projects';

import RelativeTime from '../../components/RelativeTime';
import Avatar, {AvatarSize} from '../../components/Avatar';

import { Link } from "react-router-dom";
import SectionHeader from './SectionHeader';

function CardListHeader({headers} : {headers: Array<{id: string, label: string}>}) : JSX.Element {
  return <div className="flex gap-14 mt-4 px-2">
    {headers.map((header) => <div key={header.id} className="w-1/4 text-xs text-dark-2">{header.label}</div>)}
  </div>;
}

function Timeline({percentage, startDate, endDate}) : JSX.Element {
  return <div>
    <div className="text-dark-1 text-xs">{startDate} - {endDate}</div>
    <div className="flex gap-2 items-center">
      <div className="flex-1 relative h-1.5">
        <div className="absolute bg-dark-8% h-1.5 rounded-full w-full"></div>
        <div className="absolute bg-brand-base h-1.5 rounded-full" style={{width: percentage + "%"}}></div>
      </div>

      <div className="text-xs text-dark-1">
        {percentage}%
      </div>
    </div>
  </div>;
}

interface Owner {
  id: string;
  fullName: string;
  avatarUrl?: string;
  title: string;
}

interface Project {
  id: string;
  name: string;
  updatedAt: string;
  owner?: Owner;
}

function Card({project} : {project: Project}) : JSX.Element {
  return <Link to={`/projects/` + project.id} className="flex gap-14 mt-2 rounded-lg p-4 bg-white items-center card-shadow hover:card-shadow-blue">
    <div className="w-1/3">
      <div className="text-brand-base font-bold">{project.name}</div>
      <div className="text-dark-2 text-xs">In Shipping phase, 12 days and 1 milestone remaining</div>
    </div>

    <div className="w-2/6">
      <Timeline percentage={71} startDate="Apr 6" endDate="Aug 12" />
    </div>

    <div className="w-2/6">
      {project.owner && <Champion person={project.owner} />}
      <div className="text-dark-2 text-xs ml-8">with 2 colaborators</div>
    </div>
    <div className="w-2/6 text-dark-2">
      <RelativeTime date={project.updatedAt} />
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

export default function Projects({objectiveID} : {objectiveID: string}) : JSX.Element {
  const { t } = useTranslation();

  const { loading, error, data } = useProjects({objectiveId: objectiveID});

  const headers = [
    {id: "title", label: t("objectives.project_list_title")},
    {id: "timeline", label: t("objectives.project_list_timeline")},
    {id: "team", label: t("objectives.project_list_team")},
    {id: "lastUpdate", label: t("objectives.project_list_last_updated")}
  ];

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error) return <p>{t("error.error")}: {error.message}</p>;

  if (data.projects.length === 0) return <></>;

  return <div className="mt-4">
    <SectionHeader>{t("objectives.projects_in_progress_title")}</SectionHeader>

    <CardListHeader headers={headers} />

    {data.projects.map((project : Project) => <Card key={project.id} project={project} />)}
  </div>;
}
