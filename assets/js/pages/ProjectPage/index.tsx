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

function UpdateComment({ comment }) {
  return (
    <div className="flex items-start gap-4 border-t border-gray-700 p-4 px-7">
      <div className="mt-1">
        <Avatar person={comment.author} size={AvatarSize.Small} />
      </div>
      <div className="w-full">
        <div className="flex gap-1 justify-between">
          <div className="flex gap-1 justify-between">
            <div className="font-bold">{comment.author.fullName}</div>
            &middot;
            <div className="text-sm text-gray-400">{comment.author.title}</div>
          </div>

          <div className="text-gray-300 mr-1">
            <RelativeTime date={comment.insertedAt} />
          </div>
        </div>
        <div className="mt-1">{comment.content}</div>
      </div>
    </div>
  );
}

function Update({ update }) {
  const { data, loading, error } = useMe();

  if (loading || error) return "";

  const me = data.me;

  return (
    <div className="bg-[#303030] rounded-lg mb-8 relative z-30 -mx-6 overflow-hidden">
      <div className="px-4 py-4 flex items-center justify-between bg-new-dark-2">
        <div className="text-lg flex gap-2 items-center">
          {update.author.fullName.split(" ")[0]} is waiting for you to
          acknowlegde this update.
        </div>
        <div className="flex rounded-lg border border-brand-base px-2 py-1 hover:border-brand-base cursor-pointer transition">
          <Icon name="double checkmark" color="light" hoverColor="light" /> Ack
        </div>
      </div>

      <div className="flex gap-2 items-center mb-4 z-20 relative px-6 pt-6">
        <div className="absolute right-9">
          <RelativeTime date={update.insertedAt} />
        </div>

        <Avatar person={update.author} />
        <div>
          <div className="font-bold">{update.author.fullName}</div>
          <div className="text-sm">{update.author.title}</div>
        </div>
      </div>

      <div className="text-xl px-8 pt-4 pb-2">
        <div className="uppercase text-xs mb-6 font-bold">STATUS UPDATE</div>
        {update.message}
      </div>

      <div className="pb-4 pt-4 px-8 flex items-center gap-2">
        <div className="flex rounded-lg border border-gray-700 px-2 py-1 hover:border-brand-base cursor-pointer transition">
          <Icon name="like" color="light" hoverColor="light" />
        </div>
      </div>

      {update.comments.map((c, i) => (
        <UpdateComment key={i} comment={c} />
      ))}

      <div className="flex items-center gap-4 border-t border-gray-700 p-4 px-7">
        <div className="mt-1">
          <Avatar person={me} size={AvatarSize.Small} />
        </div>
        <div className="text-gray-300">Leave a comment &hellip;</div>
      </div>
    </div>
  );
}

function ProjectCreatedActivity({ authorFullName, date }) {
  return (
    <div className="mt-4 flex gap-2 items-center mb-4 z-20 relative">
      <div className="absolute right-2">
        <RelativeTime date={date} />
      </div>
      <div className="border border-gray-700 p-2 rounded-full bg-gray-700 ml-1">
        <LightningBoltIcon />
      </div>
      Project Created by {authorFullName}
    </div>
  );
}

function Event({ eventData }) {
  switch (eventData.__typename) {
    case "ActivityStatusUpdate":
      return <Update update={eventData} />;

    case "ActivityCreated":
      return (
        <ProjectCreatedActivity
          date={eventData.insertedAt}
          authorFullName={eventData.author.fullName}
        />
      );
  }
}

function Activity({ data }) {
  return (
    <div className="relative fadeIn">
      <div className="absolute top-1 bottom-1 left-5 border-l border-gray-700"></div>

      {data.project.activities.map((u, i) => (
        <Event key={i} project={data.project} eventData={u} />
      ))}
    </div>
  );
}

function Tab(props) {
  let { active, title, onClick } = props;

  const activeClass = active
    ? "bg-gray-700 cursor-default"
    : "hover:bg-gray-700 cursor-pointer";

  return (
    <div
      className={
        "border rounded-full border-gray-700 px-3 py-1 transition-colors relative flex items-center" +
        " " +
        activeClass
      }
      onClick={onClick}
    >
      {title}
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

  const [activeTab, setActiveTab] = React.useState("overview");

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
