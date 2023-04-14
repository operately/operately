import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, gql } from '@apollo/client';

import Avatar, {AvatarSize} from '../../components/Avatar';

const GET_ALIGNED_PROJECTS = gql`
  query GetAlignedProjects($objectiveID: ID!) {
    alignedProjects(objectiveID: $objectiveID) {
      id
      name
      updatedAt

      owner {
        full_name
        title
      }
    }
  }
`;

function Title() : JSX.Element {
  const { t } = useTranslation();

  return <h1 className="uppercase text-sm px-2">{t("objectives.projects_in_progress_title")}</h1>;
}

function CardListHeader({headers} : {headers: Array<{id: string, label: string}>}) : JSX.Element {
  return <div className="flex gap-2 mt-4 px-2">
    {headers.map((header) => <div key={header.id} className="w-1/4 text-sm">{header.label}</div>)}
  </div>;
}

interface Owner {
  full_name: string;
  title: string;
}

interface Project {
  id: string;
  name: string;
  updatedAt: string;
  owner: Owner;
}

function Card({project} : {project: Project}) : JSX.Element {
  return <div className="flex gap-2 mt-2 rounded shadow p-2 bg-white">
    <div className="w-1/4 text-sm">{project.name}</div>
    <div className="w-1/4 text-sm">---</div>
    <div className="w-1/4 text-sm"><Champion person={project.owner} /></div>
    <div className="w-1/4 text-sm">{project.updatedAt}</div>
  </div>;
}

function Champion({person} : {person: Owner}) : JSX.Element {
  return (
    <div className="flex gap-2 items-center">
      <Avatar person_full_name={person.full_name} size={AvatarSize.Small} />
      <div>{person.full_name}</div>
    </div>
  );
}

export default function Projects({objectiveID} : {objectiveID: string}) : JSX.Element {
  const { t } = useTranslation();

  const { loading, error, data } = useQuery(GET_ALIGNED_PROJECTS, {
    variables: { objectiveID }
  });

  const headers = [
    {id: "title", label: t("objectives.project_list_title")},
    {id: "timeline", label: t("objectives.project_list_timeline")},
    {id: "team", label: t("objectives.project_list_team")},
    {id: "lastUpdate", label: t("objectives.project_list_last_updated")}
  ];

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error) return <p>{t("error.error")}: {error.message}</p>;

  if (data.alignedProjects.length === 0) return <></>;

  console.log(data);

  return <div className="mt-4">
    <Title />

    <CardListHeader headers={headers} />

    {data.alignedProjects.map((project : Project) => <Card key={project.id} project={project} />)}
  </div>;
}
