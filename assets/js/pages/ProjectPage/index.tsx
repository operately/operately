import React from "react";
import { useProject } from "../../graphql/Projects";
import { useParams, Link } from "react-router-dom";
import Avatar, { AvatarSize } from "../../components/Avatar";
import Icon from "../../components/Icon";

import { Cross1Icon, ShuffleIcon } from "@radix-ui/react-icons";

import { LightningBoltIcon } from "@radix-ui/react-icons";
import AbsoluteTime from "../../components/AbsoluteTime";
import RelativeTime from "../../components/RelativeTime";
import { useMe } from "../../graphql/Me";

import * as PaperContainer from "../../components/PaperContainer";
import * as PhasePills from "../../components/PhasePills";
import * as Tabs from "../../components/Tabs";

import Overview from "./Overview";
import Activity from "./Activity";

function Milestone({ milestone }) {
  return (
    <div className="border-t border-gray-700 flex items-center justify-between">
      <div className="mt-4 flex gap-2 items-center mb-4">
        {milestone.status === "done" ? (
          <div className="border-2 border-brand-base h-7 w-7 rounded-full flex items-center justify-center cursor-pointer">
            <Icon name="checkmark" color="brand" size="small" />{" "}
          </div>
        ) : (
          <div className="border-2 border-gray-700 h-7 w-7 rounded-full flex items-center justify-center hover:border-brand-base cursor-pointer"></div>
        )}
        {milestone.title}
      </div>

      <div className="text-right">
        <AbsoluteTime date={milestone.deadlineAt} />
      </div>
    </div>
  );
}

function Milestones({ milestones }) {
  let sortedMilestones = [].concat(milestones).sort((m1, m2) => {
    let d1 = +new Date(m1.deadlineAt);
    let d2 = +new Date(m2.deadlineAt);

    return d1 - d2;
  });

  return (
    <div className="mt-16">
      <h1 className="uppercase font-bold mb-4">Milestones</h1>

      {sortedMilestones.map((milestone) => (
        <Milestone key={milestone.id} milestone={milestone} />
      ))}
    </div>
  );
}

function Timeline({ data }) {
  return <div>Timeline</div>;
}

function ChampionBadge() {
  return (
    <div className="text-xs uppercase bg-brand-base px-1 py-0.5 rounded">
      Champion
    </div>
  );
}

function Contributors({ data }) {
  return (
    <div className="fadeIn">
      <div className="mt-12">
        <div className="border-t border-b border-gray-700 flex items-center justify-between py-4">
          {data.project.owner ? (
            <div className="flex gap-2 items-center">
              <Avatar person={data.project.owner} />
              <div>
                <div className="font-bold flex gap-2 items-center">
                  {data.project.owner.fullName} <ChampionBadge />
                </div>
                <div className="">
                  Responsible for achieving results on this project and for
                  providing timely updates
                </div>
              </div>
            </div>
          ) : (
            <div></div>
          )}

          <div>
            <div className="hover:bg-gray-700 p-2.5 border border-gray-700 rounded-full cursor-pointer transition">
              <ShuffleIcon />
            </div>
          </div>
        </div>

        {data.project.contributors.map((c) => (
          <div className="border-t border-b border-gray-700 flex items-center justify-between py-4">
            <div className="flex gap-2 items-center">
              <Avatar person={c.person} />

              <div>
                <div className="flex gap-1 items-center">
                  <span className="font-bold">{c.person.fullName}</span>{" "}
                  &middot; {c.person.title}
                </div>
                <div className="">{c.responsibility}</div>
              </div>
            </div>

            <div>
              <div className="hover:bg-gray-700 p-2.5 border border-gray-700 rounded-full cursor-pointer transition">
                <Cross1Icon />
              </div>
            </div>
          </div>
        ))}

        <div className="border-t border-b border-gray-700 flex items-center justify-between py-4">
          <div className="flex gap-2 items-center">
            <div className="mx-2">
              <Icon name="plus" size="base" color="dark-2" />
            </div>
            Add Contributors
          </div>
        </div>
      </div>
    </div>
  );
}

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
          <div className="border-2 border-white rounded-full -ml-[6px]">
            <div
              className="rounded-full"
              style={{
                background: "#fafafa",
              }}
            >
              <Avatar key={index} person={c.person} size={AvatarSize.Small} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveTabContent({ data, activeTab }): JSX.Element {
  switch (activeTab) {
    case "overview":
      return <Overview data={data} />;

    case "timeline":
      return <Timeline data={data} />;

    case "activity":
      return <Activity data={data} />;

    case "contributors":
      return <Contributors data={data} />;

    default:
      throw "Unknown tab " + activeTab;
  }
}

export function ProjectPage() {
  const { id } = useParams();

  if (!id) return <p className="mt-16">Unable to find project</p>;

  const [activeTab, setActiveTab] = React.useState("activity");

  const { loading, error, data } = useProject(id);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  let project = data.project;
  let parents = project.parents;
  let parentName = parents[parents.length - 1].title;

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

        <Tabs.Container
          active={activeTab}
          onTabChange={(id) => setActiveTab(id)}
        >
          <Tabs.Tab id="overview" title="Overview" icon="groups" />
          <Tabs.Tab id="timeline" title="Timeline" icon="groups" />
          <Tabs.Tab id="activity" title="Activity" icon="groups" />
          <Tabs.Tab id="contributors" title="Contributors" icon="groups" />
        </Tabs.Container>

        <ActiveTabContent data={data} activeTab={activeTab} />
      </PaperContainer.Body>
    </PaperContainer.Root>
  );
}
