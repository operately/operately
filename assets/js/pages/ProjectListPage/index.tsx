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

function daysIntoYear() {
  return (
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
    24 /
    60 /
    60 /
    1000
  );
}

const daysAgo = (date: Date, n: number): Date => {
  var d = new Date(date);
  return new Date(d.setDate(d.getDate() - Math.abs(n)));
};

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

  const calcPosition = (daySize: number, firstDate: Date, date: Date) => {
    const daysDifference = Math.floor((+date - +firstDate) / 86400000);
    return daySize * daysDifference;
  };

  const calcLabel = (date: Date) => {
    return date.getMonth() > 0
      ? date.toLocaleString("default", { month: "short" })
      : date.getFullYear().toString();
  };

  let labels: { label: string; position: number }[] = [];
  let now = new Date();
  let daySize = 100.0 / 365;
  let firstDate = daysAgo(now, 366 / 2);

  let position = Number.MAX_SAFE_INTEGER;
  let date = new Date(now.getFullYear() + 1, now.getMonth(), 1);

  while (position > -100) {
    date = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    position = calcPosition(daySize, firstDate, date);

    labels.push({ label: calcLabel(date), position: position });
  }

  return (
    <div className="bottom-0 left-0 right-0 top-20 absolute flex items-center justify-center">
      <div className="absolute bottom-4 left-0 right-0 top-0 text-center">
        {labels.map((label) => (
          <div
            className="flex flex-col h-full items-center justify-center gap-2 w-[1px]"
            style={{
              position: "absolute",
              left: `${label.position}%`,
              top: "0px",
            }}
          >
            <div className="border-l border-gray-700 h-full"></div>
            <div className="">{label.label}</div>
          </div>
        ))}
        <div className="flex flex-col h-full items-center justify-center gap-2 relative z-1">
          <div className="bg-brand-base text-new-dark-1 rounded px-2 font-semibold">
            TODAY
          </div>
          <div className="border-l border-brand-base h-full mb-8"></div>
        </div>

        <div className="bg-new-dark-2 backdrop-blur-sm border border-gray-700 py-1 px-4 rounded-lg text-left top-[250px] left-40 w-64 absolute">
          Zendesk Integration
        </div>

        <div className="bg-new-dark-2 backdrop-blur-sm border border-gray-700 py-1 px-4 rounded-lg text-left top-[290px] left-40 w-64 absolute">
          Okta Support
        </div>

        <div className="bg-new-dark-2 backdrop-blur-sm border border-gray-700 py-1 px-4 rounded-lg text-left top-[330px] left-32 w-[800px] absolute">
          Hire new engineers
        </div>
      </div>
    </div>
  );
}
