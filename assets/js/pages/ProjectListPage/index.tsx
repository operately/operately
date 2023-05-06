import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import ButtonLink from "../../components/ButtonLink";
import PageTitle from "../../components/PageTitle";
import Card from "../../components/Card";
import CardList from "../../components/CardList";

import { listProjects, useProjects } from "../../graphql/Projects";

export async function ProjectListPageLoader(apolloClient: any) {
  await listProjects(apolloClient, {});
  return {};
}

function ListOfProjects({ projects }) {
  return (
    <CardList>
      {projects.map(({ id, name, description }: any) => (
        <Link key={name} to={`/projects/${id}`}>
          <Card>
            {name} {description ? " - " + description : ""}
          </Card>
        </Link>
      ))}
    </CardList>
  );
}

export function ProjectListPage() {
  const { t } = useTranslation();
  const { loading, error, data } = useProjects({});

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error)
    return (
      <p>
        {t("error.error")}: {error.message}
      </p>
    );

  // return (
  //   <div className="max-w-6xl mx-auto mb-4">
  //     <div className="m-11 mt-24">
  //       <PageTitle
  //         title={t("Projects")}
  //         buttons={[
  //           <ButtonLink key="new" to="/projects/new">
  //             {t("actions.add_project")}
  //           </ButtonLink>,
  //         ]}
  //       />

  //       <ListOfProjects projects={data.projects} />
  //     </div>
  //   </div>
  // );

  return (
    <div className="bottom-0 left-0 right-0 top-20 absolute flex items-center justify-center">
      <div className="absolute bottom-4 left-0 right-0 top-0 text-center flex items-center gap-32 justify-center">
        <div className="flex flex-col h-full items-center justify-center gap-2">
          <div className="border-l border-gray-700 h-full"></div>
          <div className="">feb</div>
        </div>
        <div className="flex flex-col h-full items-center justify-center gap-2">
          <div className="border-l border-gray-700 h-full"></div>
          <div className="">mar</div>
        </div>
        <div className="flex flex-col h-full items-center justify-center gap-2">
          <div className="border-l border-gray-700 h-full"></div>
          <div className="">apr</div>
        </div>
        <div className="flex flex-col h-full items-center justify-center gap-2">
          <div className="border-l border-gray-700 h-full"></div>
          <div className="">may</div>
        </div>
        <div className="flex flex-col h-full items-center justify-center gap-2">
          <div className="border-l border-gray-700 h-full"></div>
          <div className="bg-brand-base text-new-dark-1 rounded px-2 font-semibold">
            TODAY
          </div>
        </div>
        <div className="flex flex-col h-full items-center justify-center gap-2">
          <div className="border-l border-gray-700 h-full"></div>
          <div className="">jun</div>
        </div>
        <div className="flex flex-col h-full items-center justify-center gap-2">
          <div className="border-l border-gray-700 h-full"></div>
          <div className="">jul</div>
        </div>
        <div className="flex flex-col h-full items-center justify-center gap-2">
          <div className="border-l border-gray-700 h-full"></div>
          <div className="">aug</div>
        </div>
        <div className="flex flex-col h-full items-center justify-center gap-2">
          <div className="border-l border-gray-700 h-full"></div>
          <div className="">sep</div>
        </div>

        <div className="bg-new-dark-2 backdrop-blur-sm border border-gray-700 py-2 px-4 rounded-lg text-left top-[250px] left-40 w-64 absolute">
          Zendesk Integration
        </div>

        <div className="bg-new-dark-2 backdrop-blur-sm border border-gray-700 py-2 px-4 rounded-lg text-left top-[300px] left-40 w-64 absolute">
          Okta Support
        </div>

        <div className="bg-new-dark-2 backdrop-blur-sm border border-gray-700 py-2 px-4 rounded-lg text-left top-[350px] left-32 w-[800px] absolute">
          Hire new engineers
        </div>
      </div>
    </div>
  );
}
