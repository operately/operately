import React from "react";

import classnames from "classnames";

import { useDocumentTitle } from "@/layouts/header";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Cards from "@/components/Cards";

import Activity from "./Activity";
import Header from "./Header";
import Timeline from "./Timeline";
import Description from "./Description";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as Me from "@/graphql/Me";
import * as Milestones from "@/graphql/Projects/milestones";

import RichContent from "@/components/RichContent";
import FormattedTime from "@/components/FormattedTime";

import { RightSidebarPortal } from "@/layouts/DefaultLayout";

export async function loader({ params }) {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  let meData = await client.query({
    query: Me.GET_ME,
  });

  return {
    project: projectData.data.project,
    me: meData.data.me,
  };
}

export function Page() {
  const [data, refetch] = Paper.useLoadedData();

  return <Overview me={data.me} project={data.project} refetch={refetch} />;
}

function Overview({ me, project, refetch }) {
  useDocumentTitle(project.name);

  return (
    <Paper.Root size="medium" rightSidebar={<Sidebar project={project} />}>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects`}>
          <Icons.IconClipboardList size={16} />
          All Projects
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body minHeight="600px">
        <Header project={project} />
        <Timeline me={me} project={project} refetch={refetch} />
        <Description me={me} project={project} />

        <div className="grid grid-cols-3 gap-4">
          <MilestonesCard project={project} />
          <DocumentationCard project={project} />
          <StatuUpdatesCard project={project} />
        </div>

        <Activity projectId={project.id} />
      </Paper.Body>

      <Paper.RightToolbox>
        <PinToHomePage project={project} refetch={refetch} />
      </Paper.RightToolbox>
    </Paper.Root>
  );
}

function Sidebar({ project }) {
  const tasks = [
    {
      title: "Write a project description",
      completed: project.description !== null,
    },
    {
      title: "Set the start and due dates",
      completed: project.staredAt !== null && project.deadline !== null,
    },
    {
      title: "Invite team members and assign roles",
      completed: project.contributors.length > 1,
    },
    {
      title: "Define the project milestones",
      completed: project.milestones.length > 0,
    },
    {
      title: "Write a status update",
      completed: project.updates.length > 0,
    },
  ];

  return (
    <div className="px-4 pt-16">
      <h1 className="font-bold mb-4 text-xl">Champion's Toolbar</h1>
      <p className="text-sm">
        You are the champion of this project, responsible for leading the execution, setting up the team and their
        roles, and providing regular status updates about the progress.
      </p>

      <div>
        <h1 className="font-bold mb-4 mt-8">Your Tasks</h1>

        <div className="flex flex-col gap-2">
          {tasks.map((task, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={classnames("border rounded-full w-6 h-6 flex items-center justify-center text-xs", {
                  "border-green-400/70 text-green-400": task.completed,
                  "border-white-2 text-white-1": !task.completed,
                })}
              >
                {task.completed ? <Icons.IconCheck size={14} /> : index + 1}
              </div>

              <span>{task.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PinToHomePage({ project, refetch }) {
  const [pin, { loading }] = Projects.usePinProjectToHomePage({
    onCompleted: (res) => {
      refetch();
    },
  });

  const handlePin = () => {
    pin({
      variables: {
        projectId: project.id,
      },
    });
  };

  return (
    <div className={`rounded-r-lg bg-dark-3 p-3 cursor-pointer `} onClick={handlePin}>
      {project.isPinned ? (
        <Icons.IconStarFilled size={20} className={`text-yellow-400 ${loading && "animate-pulse"}`} />
      ) : (
        <Icons.IconStar size={20} className={`text-white-1 ${loading && "animate-pulse"}`} />
      )}
    </div>
  );
}

function DocumentationCardListItem({ title, completed, pending }) {
  let fileIcon: React.ReactNode | null = null;
  let statusIcon: React.ReactNode | null = null;

  let titleColor: string | null = null;

  if (completed) {
    fileIcon = <Icons.IconFileText size={20} className="text-pink-400" />;
    statusIcon = <Icons.IconCircleCheckFilled size={20} className="text-green-400" />;
    titleColor = "text-white-1";
  } else if (pending) {
    fileIcon = <Icons.IconFileDots size={20} className="text-yellow-400/80" />;
    statusIcon = <Icons.IconCircleDot size={20} className="text-yellow-400" />;
    titleColor = "text-white-1";
  } else {
    fileIcon = <Icons.IconFileText size={20} className="text-white-3" />;
    statusIcon = <Icons.IconCircle size={20} className="text-white-3" />;
    titleColor = "text-white-3";
  }

  return (
    <div className="flex justify-between mb-1.5">
      <div className="flex items-center gap-1">
        <div className={classnames("font-bold", titleColor)}>{title}</div>
      </div>
    </div>
  );
}

function CardSectionTitle({ title }) {
  return <div className="font-bold mb-2 text-xs uppercase text-pink-400">{title}</div>;
}

function DocumentationCard({ project }) {
  return (
    <Cards.Card linkTo={`/projects/${project.id}/documentation`}>
      <Cards.Header>
        <div className="flex items-center gap-2">
          <Icons.IconFileStack size={20} />
          <Cards.Title>Documentation</Cards.Title>
        </div>
      </Cards.Header>

      <Cards.Body>
        <div className="mt-4">
          <CardSectionTitle title="Next in line" />

          <DocumentationCardListItem
            title="Project Pitch"
            completed={project.pitch}
            pending={Projects.shouldBeFilledIn(project, "pitch")}
          />
        </div>

        <div className="mt-4">
          <CardSectionTitle title="Last Submitted" />

          <div className="text-white-2">No documenation yet. Asking for submission on the end of each phase.</div>
        </div>
      </Cards.Body>
    </Cards.Card>
  );
}

function MilestonesCard({ project }) {
  const upcomming = Milestones.sortByDeadline(project.milestones).filter((m) => m.status === "pending");

  return (
    <Cards.Card linkTo={`/projects/${project.id}/milestones`}>
      <Cards.Header>
        <div className="flex items-center gap-2">
          <Icons.IconCalendarEvent size={20} className="text-white-1" />
          <Cards.Title>Timeline</Cards.Title>
        </div>
      </Cards.Header>

      <Cards.Body>
        <div className="mt-6">
          <CardSectionTitle title="Project Phase" />

          <div className="font-bold capitalize">{project.phase}</div>
        </div>

        <div className="mt-4">
          <CardSectionTitle title="Upcomming Milestone" />

          {upcomming.length === 0 ? (
            <div className="text-white-2">No upcomming milestone.</div>
          ) : (
            <div className="font-bold">{upcomming[0].title}</div>
          )}
        </div>
      </Cards.Body>
    </Cards.Card>
  );
}

function MilestoneList({ phase, milestones }) {
  return (
    <div>
      <div className="font-medium text-xs uppercase mb-2 pt-2">{phase} phase</div>

      {milestones.map((m) => (
        <div className="flex items-start gap-1 border-y border-shade-2 py-1">
          <div className="shrink-0 mt-0.5">
            <Icons.IconFlag2 size={16} className="text-yellow-400" />
          </div>

          <div className="flex-1">
            <div className="font-bold">{m.title}</div>

            {m.deadlineAt && (
              <div className="text-xs text-white-2">
                <FormattedTime time={m.deadlineAt} format="short-date-with-weekday-relative" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// {milestones.slice(0, 4).map((m) => (
//   <div key={m.id} className="border-t border-b border-shade-1 py-1 flex justify-between">
//     <div className="flex items-center gap-1 font-medium truncate">
//       <div className="shrink-0">
//         {m.status === "done" ? (
//           <Icons.IconCircleCheck size={20} className="text-green-400" />
//         ) : (
//           <Icons.IconCircle size={20} className="text-yellow-400" />
//         )}
//       </div>

//       <div className="truncate">{m.title}</div>
//     </div>
//   </div>
// ))}

// {milestones.length > 4 && (
//   <div className="flex items-center gap-2 rounded-lg py-1 ml-0.5 text-white-2">
//     <Icons.IconDotsVertical size={16} />
//     {milestones.length - 4} other, {milestones.filter((m) => m.status === "pending").length} pending
//   </div>
// )}

function StatusUpdatesCardItem({ update }: { update: Projects.Update }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-medium flex-1">
        <div className="line-clamp-2">
          <RichContent jsonContent={update.message} />
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1.5 mt-3">
        {update.acknowledged ? (
          <>
            <Icons.IconCircleCheckFilled size={14} className="text-green-400" />
            acknowledged
          </>
        ) : (
          <>
            <Icons.IconClockFilled size={14} className="text-yellow-400" />
            waiting for acknowledgment
          </>
        )}
      </div>
    </div>
  );
}

function StatuUpdatesCard({ project }: { project: Projects.Project }) {
  return (
    <Cards.Card linkTo={`/projects/${project.id}/updates`}>
      <Cards.Header>
        <div className="flex items-center gap-2">
          <Icons.IconReport size={20} className="text-white-1" />
          <Cards.Title>Status Updates</Cards.Title>
        </div>
      </Cards.Header>

      <Cards.Body>
        <div className="mt-4">
          <CardSectionTitle title="Last Update" />

          {project.updates.length === 0 ? (
            <div className="text-white-2">No updates yet. Asking the champion every week for an update.</div>
          ) : (
            <StatusUpdatesCardItem update={project.updates[0]} />
          )}
        </div>
      </Cards.Body>
    </Cards.Card>
  );
}

function KeyResourcesCardItem({ icon, title }) {
  return (
    <div className="border-t border-b border-shade-1 flex items-center gap-1.5 rounded-lg py-1">
      <div className="shrink-0">{icon}</div>
      <div className="truncate">{title}</div>
    </div>
  );
}

function KeyResourcesCard({ project }) {
  return (
    <Cards.Card linkTo="/">
      <Cards.Header>
        <Cards.Title>Key Resources</Cards.Title>
      </Cards.Header>

      <Cards.Body>
        <KeyResourcesCardItem
          icon={<Icons.IconBrandGithub size={20} />}
          title="GitHub Repository for the Operately repository"
        />
        <KeyResourcesCardItem icon={<Icons.IconBrandFigma size={20} />} title="Figma Design" />
        <KeyResourcesCardItem icon={<Icons.IconFileDescription size={20} />} title="Architecture Diagram" />
        <KeyResourcesCardItem icon={<Icons.IconBrandSlack size={20} />} title="Slack Channel" />
      </Cards.Body>
    </Cards.Card>
  );
}

function Phases({ project }) {
  const times = [
    { name: "Concept", time: "Apr 1st", status: "complete" },
    { name: "Planning", time: "May 5th", status: "complete" },
    { name: "Execution", time: "Jul 1st", status: "active" },
    { name: "Control", time: "Aug 10th", status: "pending" },
    { name: "Closing", time: "Aug 21th", status: "pending" },
  ];

  return (
    <div className="relative">
      <div className="py-3 cursor-pointer grid grid-cols-6 bg-dark-3 border-b border border-shade-2 rounded shadow px-4 mx-16">
        <div className="flex flex-col items-center">
          <div className="font-bold flex items-center gap-2">
            <Icons.IconRocket size={16} className="text-green-400" />
            Created On
          </div>
          <div className="text-sm">Jan 31st</div>
        </div>

        {times.map((phase, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <PhaseIcon status={phase.status} />
              <span className="font-bold">{phase.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              {phase.status === "active" && <span className="">Due:&nbsp;</span>}
              <div className="text-sm">{phase.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseIcon({ status }) {
  switch (status) {
    case "start":
      return <Icons.IconCircleDot size={16} className="text-green-400" />;

    case "complete":
      return <Icons.IconCircleCheck size={16} className="text-green-400" />;

    case "active":
      return <Icons.IconCircleDot size={16} className="text-yellow-400" />;

    case "pending":
      return <Icons.IconCircle size={16} />;

    default:
      throw new Error("Invalid status");
  }
}
