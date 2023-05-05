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

  return (
    <div className="max-w-6xl mx-auto mb-4">
      <div className="m-11 mt-24">
        <PageTitle
          title={t("Projects")}
          buttons={[
            <ButtonLink key="new" to="/projects/new">
              {t("actions.add_project")}
            </ButtonLink>,
          ]}
        />

        <ListOfProjects projects={data.projects} />
      </div>
    </div>
  );
}
