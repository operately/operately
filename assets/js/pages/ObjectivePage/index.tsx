import React from "react";

import { useTranslation } from "react-i18next";
import { useObjective } from "@/graphql/Objectives";
import { useMe } from "@/graphql/Me";
import { Link, useParams } from "react-router-dom";

import * as PaperContainer from "../../components/PaperContainer";
import Icon, { IconSize } from "@/components/Icon";
import Avatar, { AvatarSize } from "@/components/Avatar";
import KeyResults from "./KeyResults";
import RichContent from "@/components/RichContent";
import LinkButton from "@/components/LinkButton";
import * as Chat from "@/components/Chat";

function Badge({ title, className }): JSX.Element {
  return (
    <div
      className="inline-block"
      style={{
        verticalAlign: "middle",
      }}
    >
      <div
        className={className + " font-bold uppercase flex items-center"}
        style={{
          padding: "4px 10px 2px",
          borderRadius: "25px",
          fontSize: "12.5px",
          lineHeight: "20px",
          height: "24px",
          letterSpacing: "0.03em",
          display: "flex",
          gap: "10",
          marginTop: "2px",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function Champion({ person }): JSX.Element {
  return (
    <div
      className="relative inline-block"
      style={{
        marginLeft: "18px",
        marginRight: "10px",
        verticalAlign: "middle",
      }}
    >
      <Avatar person={person} size={AvatarSize.Small} />

      <div className="absolute top-[-6px] left-[21px]">
        <ChampionCrown />
      </div>
    </div>
  );
}

function ObjectiveHeader({ name, owner }): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-3.5 items-center">
        <div className="shrink-0">
          <Icon name="objectives" size="large" />
        </div>

        <h1 className="font-bold text-[31.1px]" style={{ lineHeight: "40px" }}>
          {name} <Champion person={owner} />{" "}
          <Badge title="On Track" className="bg-success-2 text-success-1" />
        </h1>
      </div>
    </div>
  );
}

function ChampionCrown() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="14" height="14" rx="3" fill="#3185FF" />
      <path
        d="M7 3.5L9.33333 7L12.25 4.66667L11.0833 10.5H2.91667L1.75 4.66667L4.66667 7L7 3.5Z"
        fill="#FFE600"
      />
    </svg>
  );
}

function SectionTitle({ title, icon, iconSize = "small" }) {
  return (
    <div className="flex items-center gap-[9px] mt-[24px]">
      <Icon name={icon} size={iconSize as IconSize} color="brand" />
      <div
        className="uppercase text-dark-base text-sm"
        style={{
          letterSpacing: "0.03em",
        }}
      >
        {title}
      </div>
    </div>
  );
}

function Description({ description }): JSX.Element {
  return (
    <div className="border-b border-dark-8% pb-[22px]">
      <SectionTitle title="Description" icon="description" />

      <div className="mt-[10px] pr-[62px]">
        <RichContent jsonContent={description} />
      </div>
    </div>
  );
}

function Feed({ updates }): JSX.Element {
  const { data } = useMe();

  return (
    <div className="border-b border-dark-8% pb-[22px]">
      <SectionTitle title="Activity" icon="description" />

      <div className="mt-[10px]">
        {updates.map((u) => (
          <Chat.Post key={u.id} update={u} currentUser={data.me} />
        ))}
      </div>
    </div>
  );
}

function Project({ project }): JSX.Element {
  return (
    <div className="rounded-[10px] border border-dark-8p p-[20px]">
      <Link
        to={`/projects/${project.id}`}
        className="font-bold text-[18px] leading-[27px] underline text-brand-1"
      >
        {project.name}
      </Link>
    </div>
  );
}

function Projects({ projects }): JSX.Element {
  return (
    <div className="border-b border-dark-8% pb-[22px]">
      <SectionTitle title="PROJECTS IN PROGRESS" icon="my projects" />

      <div className="mt-[10px] flex flex-col gap-[10px] mb-[10px]">
        {projects.map((p) => (
          <Project key={p.id} project={p} />
        ))}
      </div>

      <LinkButton title="View 2 archived projects" size="small" />
    </div>
  );
}

export function ObjectivePage() {
  const { t } = useTranslation();
  const { id } = useParams();

  if (!id) return <p>Unable to find objective</p>;

  const { loading, error, data } = useObjective(id);

  if (loading) return <p>{t("loading.loading")}</p>;
  if (error)
    return (
      <p>
        {t("error.error")}: {error.message}
      </p>
    );

  const objective = data.objective;

  return (
    <PaperContainer.Root>
      <PaperContainer.Navigation>
        <PaperContainer.NavigationItem
          icon="objectives"
          title={"Increase sales"}
          to={`/objectives/${id}`}
        />
      </PaperContainer.Navigation>

      <PaperContainer.Body>
        <ObjectiveHeader name={objective.name} owner={objective.owner} />
        <KeyResults keyResults={objective.keyResults} />
        <Description description={objective.description} />
        <Projects projects={objective.projects} />
        <Feed updates={objective.activities} />
      </PaperContainer.Body>
    </PaperContainer.Root>
  );
}
