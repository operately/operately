import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import {
  DashboardIcon,
  RowsIcon,
  GearIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";

import ButtonLink from "../../components/ButtonLink";
import PageTitle from "../../components/PageTitle";
import Card from "../../components/Card";
import CardList from "../../components/CardList";
import Icon from "../../components/Icon";

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
  return new Date(d.setDate(d.getDate() - n));
};

export function ProjectListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loading, error, data } = useProjects({});

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error)
    return (
      <p>
        {t("error.error")}: {error.message}
      </p>
    );

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

  let projects = [];

  data.projects.forEach((project: any) => {
    if (project.startedAt == null || project.deadline == null) return;

    projects.push({
      id: project.id,
      name: project.name,
      start: new Date(project.startedAt),
      deadline: new Date(project.deadline),
    });
  });

  projects.sort((a, b) => {
    return -(a.start.getTime() - b.start.getTime());
  });

  var lines: { left: number; width: number; name: string; link: string }[] = [];
  projects.forEach((p) => {
    lines.push({
      left: calcPosition(daySize, firstDate, p.start),
      width: calcPosition(daySize, p.start, p.deadline),
      name: p.name,
      link: `/projects/${p.id}`,
    });
  });

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

        <div
          style={{
            position: "absolute",
            top: "0",
            bottom: "32px",
            left: "0",
            right: "0",
            overflowY: "scroll",
          }}
        >
          <div className="relative h-full">
            <div className="top-0 left-1/2 bottom-0 absolute w-[1px] flex flex-col items-center">
              <div className="bg-brand-base text-new-dark-1 rounded px-2 font-semibold"></div>
              <div
                className="border-l border-brand-base absolute top-0 left-1/2"
                style={{ height: lines.length * 40, minHeight: "100%" }}
              ></div>
            </div>

            {lines.map((l, i) => (
              <div
                key={i}
                className="bg-new-dark-2 backdrop-blur-sm border border-gray-700 py-0.5 px-3 rounded-lg absolute truncate text-left flex gap-1 items-center hover:border-gray-500 transition cursor-pointer"
                onClick={() => {
                  navigate(l.link);
                }}
                style={{
                  top: 80 + i * 40,
                  left: l.left + "%",
                  width: l.width + "%",
                  paddingLeft: l.left < 0 ? -l.left + "%" : "10px",
                  paddingRight: "10px",
                }}
              >
                {l.left < 0 ? (
                  <div className="scale-75">
                    <Icon name="arrow left" size="small" color="dark-2" />
                  </div>
                ) : null}
                <div className="truncate">{l.name}</div>
              </div>
            ))}

            <div className="absolute left-0 right-0 top-[00px] text-left border-t border-gray-700 p-2 flex items-center gap-2">
              <ChevronUpIcon />
              Exceptional customer service
            </div>

            <div className="absolute left-0 right-0 top-[40px] text-left border-t border-gray-700 p-2 flex items-center gap-2">
              <ChevronDownIcon />
              Profitable Growth
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
