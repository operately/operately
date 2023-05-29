import React from "react";
import { useProject } from "../../graphql/Projects";
import { useParams } from "react-router-dom";
import Avatar, { AvatarSize } from "../../components/Avatar";
import Icon from "../../components/Icon";

import * as PaperContainer from "../../components/PaperContainer";
import * as PhasePills from "../../components/PhasePills";
import * as Tabs from "../../components/Tabs";

import Overview from "./Overview";
import Timeline from "./Timeline";
import Activity from "./Activity";
import Contributors from "./Contributors";

function Badge({ title, className }): JSX.Element {
  return (
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
      }}
    >
      {title}
    </div>
  );
}

function ProjectHeader({ name }): JSX.Element {
  return (
    <div className="flex items-center justify-between mt-[23px] ">
      <div className="flex gap-3.5 items-center">
        <Icon name="my projects" color="dark-2" size="large" />

        <h1 className="font-bold text-[31.1px]" style={{ lineHeight: "40px" }}>
          {name}
        </h1>
      </div>

      <Badge title="On Track" className="bg-success-2 text-success-1" />
    </div>
  );
}

function ProjectPhases(): JSX.Element {
  return (
    <PhasePills.Container>
      <PhasePills.Item name="Concept" state="done" />
      <PhasePills.Item name="Planning" state="done" />
      <PhasePills.Item name="Execution" state="inProgress" />
      <PhasePills.Item name="Control" state="pending" />
      <PhasePills.Item name="Closing" state="pending" />
    </PhasePills.Container>
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

function ContributorList({ owner, contributors }): JSX.Element {
  return (
    <div
      className="flex items-center"
      style={{
        marginTop: "22px",
        marginLeft: "54px",
      }}
    >
      <div className="relative" style={{ marginRight: "10px" }}>
        <Avatar person={owner} size={AvatarSize.Small} />

        <div className="absolute top-[-6px] left-[21px]">
          <ChampionCrown />
        </div>
      </div>

      <div className="flex items-center">
        {contributors.map((c, index: number) => (
          <div
            key={index}
            className="border-2 border-white rounded-full -ml-[6px]"
          >
            <div
              className="rounded-full"
              style={{
                background: "#fafafa",
              }}
            >
              <Avatar person={c.person} size={AvatarSize.Small} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectPage() {
  const params = useParams();

  const id = params["id"];
  const tab = params["*"] || "";

  if (!id) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data } = useProject(id);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  let project = data.project;
  let parents = project.parents;
  let parentName = parents[parents.length - 1]!.title;

  return (
    <PaperContainer.Root>
      <PaperContainer.Navigation>
        <PaperContainer.NavigationItem icon="objectives" title={parentName} />
      </PaperContainer.Navigation>

      <PaperContainer.Body>
        <ProjectPhases />

        <ProjectHeader name={project.name} />

        <ContributorList
          owner={project.owner}
          contributors={project.contributors}
        />

        <Tabs.Container basePath={`/projects/${id}`} active={tab}>
          <Tabs.Tab
            path="/"
            title="Overview"
            icon="groups"
            element={<Overview data={data} />}
          />
          <Tabs.Tab
            path="/timeline"
            title="Timeline"
            icon="groups"
            element={<Timeline data={data} />}
          />
          <Tabs.Tab
            path="/activity"
            title="Activity"
            icon="groups"
            element={<Activity data={data} />}
          />
          <Tabs.Tab
            path="/contributors"
            title="Contributors"
            icon="groups"
            element={<Contributors data={data} />}
          />
        </Tabs.Container>
      </PaperContainer.Body>
    </PaperContainer.Root>
  );
}
