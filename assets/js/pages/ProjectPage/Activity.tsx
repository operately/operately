import React from "react";

import * as Icons from "@tabler/icons-react";

import * as Updates from "@/graphql/Projects/updates";
import * as Projects from "@/graphql/Projects";
import * as ProjectIcons from "@/components/ProjectIcons";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import ShortName from "@/components/ShortName";
import RichContent from "@/components/RichContent";

export default function Activity({ project }): JSX.Element {
  const { data, loading, error } = Updates.useListUpdates({
    fetchPolicy: "network-only",
    variables: {
      filter: {
        projectId: project.id,
      },
    },
  });

  return (
    <div className="min-h-[350px] py-8">
      <SectionTitle title="Project Activity" />

      {loading && <div>Loading...</div>}
      {error && <div>{error.message}</div>}
      {data && <ActivityList updates={data.updates} project={project} />}
    </div>
  );
}

export function ActivityList({ project, updates }: { project: Projects.Project; updates: Updates.Update[] }) {
  return (
    <div className="flex flex-col gap-4 relative">
      <div className="absolute border-l border-shade-2 top-3 bottom-3 z-10" style={{ left: "25px" }}></div>

      {updates.map((update) => (
        <div key={update.id} className="z-20">
          <UpdateItem key={update.id} project={project} update={update} />
        </div>
      ))}
    </div>
  );
}

function UpdateItem({ project, update }: { project: Projects.Project; update: Updates.Update }) {
  switch (update.messageType) {
    case "message":
      return null;

    case "status_update":
      return <StatusUpdate project={project} update={update} />;

    case "review":
      return <Review project={project} update={update as Updates.Review} />;

    case "project_created":
      return <ProjectCreated project={project} update={update} />;

    case "project_milestone_created":
      return <ProjectMilestoneCreated project={project} update={update} />;

    default:
      console.log("Unknown update type: " + update.messageType);
      return null;
  }
  // switch (activity.resourceType + "-" + activity.actionType) {
  //   case "project-create":
  //     return <ActivityItemProjectCreated activity={activity} />;
  //   case "milestone-create":
  //     return <ActivityItemMilestoneCreated activity={activity} />;
  //   case "milestone-complete":
  //     return <ActivityItemMilestoneCompleted activity={activity} />;
  //   case "milestone-uncomplete":
  //     return <ActivityItemMilestoneUnCompleted activity={activity} />;
  //   case "update-post":
  //     return <ActivityItemUpdatePost project={project} activity={activity} />;
  //   case "update-acknowledge":
  //     return <ActivityItemUpdateAcknowledged activity={activity} />;
  //   case "comment-post":
  //     return <ActivityItemCommentPost activity={activity} />;
  //   default:
  //     console.log("Unknown activity type: " + activity.resourceType + "-" + activity.actionType);
  //     return null;
  // }
}

const ContainerColors = {
  blue: {
    border: "border-blue-400/70",
    stroke: "stroke-blue-400/70",
  },
  yellow: {
    border: "border-yellow-400/50",
    stroke: "stroke-yellow-400/50",
  },
  gray: {
    border: "border-dark-8",
    stroke: "stroke-dark-8",
  },
};

function BigContainer({ person, time, children, tint = "gray" }) {
  const colors = ContainerColors[tint];

  return (
    <div className="flex items-start justify-between my-2">
      <div className={"w-full border rounded-lg relative shadow-lg bg-dark-3" + " " + colors.border}>
        <div className="flex flex-col overflow-hidden">
          <div className={"flex justify-between items-center"}>
            <div className="px-2 py-2 flex items-center gap-2">
              <Avatar person={person} size="tiny" />
              <span className="font-bold">{person.fullName}</span>
              <div className="border border-yellow-400/50 rounded-full px-1.5 py-0.5 text-yellow-400/70 text-xs font-medium">
                Champion
              </div>
            </div>

            <div className="mr-3">
              <span className="text-white-2">
                <FormattedTime time={time} format="relative" />
              </span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-b-lg">{children}</div>

          <div className="mt-4 px-4 py-2">
            <div className="flex justify-between items-center">
              <Icons.IconMoodPlus size={24} className="text-white-2 cursor-pointer" />

              <span className="text-white-2 font-medium">0 comments</span>
            </div>

            <div className="bg-dark-2 rounded-b-lg -mx-4 -mb-2 mt-3 border-t-2 border-dark-5 text-white-2 px-4 py-4">
              Post a comment...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusUpdate({ project, update }: { project: Projects.Project; update: Updates.Update }) {
  const content = update.content as Updates.StatusUpdate;
  const message = content.message;

  const oldHealth = content.oldHealth;
  const newHealth = content.newHealth;

  return (
    <BigContainer person={update.author} time={update.insertedAt}>
      <RichContent jsonContent={message} />

      {oldHealth !== newHealth && (
        <div className="mt-4 bg-shade-1 rounded p-2">
          <p className="font-medium">The project's health has changed.</p>
          <div className="flex items-center gap-2 mt-2">
            <ProjectIcons.IconForHealth health={oldHealth} /> <span className="capitalize">{oldHealth}</span> -&gt;
            <ProjectIcons.IconForHealth health={newHealth} /> <span className="capitalize">{newHealth}</span>
          </div>
        </div>
      )}
    </BigContainer>
  );
}

function ProjectCreated({ project, update }: { project: Projects.Project; update: Updates.Update }) {
  const content = update.content as Updates.UpdateContentProjectCreated;

  const champion = content.champion;
  const creator = content.creator;

  const creatorIsChampion = creator.id === champion.id;

  const who = creatorIsChampion ? (
    <span className="font-extrabold text-white-1">themselves</span>
  ) : (
    <>
      <Avatar person={champion} size="tiny" />{" "}
      <span className="font-extrabold text-white-1">
        <ShortName fullName={champion.fullName} />
      </span>
    </>
  );

  return (
    <SmallContainer time={update.insertedAt}>
      <div className="text-white-4">
        <span className="font-extrabold text-white-1">
          <ShortName fullName={creator.fullName} />
        </span>{" "}
        created this project and assigned {who} as the champion.
      </div>
    </SmallContainer>
  );
}

function ProjectMilestoneCreated({ update }: { project: Projects.Project; update: Updates.Update }) {
  const creator = update.author;

  const content = update.content as Updates.ProjectMilestoneCreated;
  const milestone = content.milestone.title;

  return (
    <SmallContainer time={update.insertedAt}>
      <div className="text-white-4">
        <span className="font-extrabold text-white-1">
          <ShortName fullName={creator.fullName} />
        </span>{" "}
        added <Icons.IconFlag2Filled size={16} className="text-yellow-400 inline-block -mt-1" />{" "}
        <span className="font-extrabold text-white-1">{milestone}</span> milestone.
      </div>
    </SmallContainer>
  );
}

function SmallContainer({ time, children }) {
  return (
    <div className="flex items-center justify-between my-2 mr-1">
      <div
        className="w-5 h-5 bg-dark-3 rounded-full flex items-center justify-center"
        style={{
          marginLeft: "15px",
          marginRight: "15px",
        }}
      >
        <div className="w-2.5 h-2.5 border-2 border-white-2 rounded-full"></div>
      </div>

      <div className="flex-1">{children}</div>
      <div className="shrink-0 ml-4 text-white-2">
        <FormattedTime time={time} format="relative" />
      </div>
    </div>
  );
}

// function ActivityItemMilestoneCreated({ activity }: { activity: Activities.Activity }) {
//   const eventData = activity.eventData as Activities.MilestoneCreateEventData;
//   const link = `/projects/${activity.scopeId}/milestones`;
//   const title = eventData.title;

//   return (
//     <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
//       <div className="font-semibold">
//         {activity.person.fullName} added a milestone:
//         <Link to={link} className="ml-1.5 font-semibold text-sky-400 underline underline-offset-2">
//           {title}
//         </Link>
//       </div>
//     </ActivityItemContainer>
//   );
// }

// function ActivityItemMilestoneCompleted({ activity }: { activity: Activities.Activity }) {
//   const link = `/projects/${activity.scopeId}/milestones`;
//   const title = activity.resource.title;

//   return (
//     <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
//       <div className="flex items-center gap-1.5 font-semibold">
//         {activity.person.fullName} checked off:
//         <Link to={link} className="font-semibold text-sky-400 underline underline-offset-2">
//           {title}
//         </Link>
//       </div>
//     </ActivityItemContainer>
//   );
// }

// function ActivityItemMilestoneUnCompleted({ activity }: { activity: Activities.Activity }) {
//   const link = `/projects/${activity.scopeId}/milestones`;
//   const title = activity.resource.title;

//   return (
//     <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
//       <div className="flex items-center">
//         <div className="font-bold">
//           {activity.person.fullName} marked the{" "}
//           <Link to={link} className="font-semibold text-blue-400 underline underline-offset-2">
//             {title}
//           </Link>{" "}
//           as pending
//         </div>
//       </div>
//     </ActivityItemContainer>
//   );
// }

import * as PhaseChange from "@/features/phase_change";

function Review({ project, update }: { project: Projects.Project; update: Updates.Review }) {
  const handler = PhaseChange.handler(
    project,
    update.previousPhase as Projects.ProjectPhase,
    update.newPhase as Projects.ProjectPhase,
  );

  const answers = JSON.parse(update.message);
  const Message = handler.activityMessage(answers);

  return (
    <BigContainer person={update.author} time={update.insertedAt}>
      <Message />
    </BigContainer>
  );
}

// <div className="bg-shade-1 py-4 px-4 mt-4 rounded-[20px] max-w-3xl">
//   <div className="line-clamp-4">
//     <RichContent jsonContent={activity.resource.message} />
//   </div>
// </div>

// function ActivityItemUpdateAcknowledged({ activity }: { activity: Activities.Activity }) {
//   const link = `/projects/${activity.scopeId}/updates/${activity.resource.id}`;

//   return (
//     <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
//       <div className="flex items-center">
//         <div className="font-bold">
//           {activity.person.fullName} acknowledged the{" "}
//           <Link to={link} className="font-semibold text-sky-400 underline underline-offset-2">
//             Status Update
//           </Link>
//         </div>
//       </div>
//     </ActivityItemContainer>
//   );
// }

// function ActivityItemCommentPost({ activity }: { activity: Activities.Activity }) {
//   const eventData = activity.eventData as Activities.CommentPostEventData;
//   const link = `/projects/${activity.scopeId}/updates/${eventData.updateId}`;

//   return (
//     <ActivityItemContainer person={activity.person} time={activity.insertedAt}>
//       <div className="flex items-center">
//         <div className="font-bold">
//           {activity.person.fullName} posted a comment on a{" "}
//           <Link to={link} className="font-semibold text-sky-400 underline underline-offset-2">
//             Status Update
//           </Link>
//         </div>
//       </div>

//       <div className="bg-shade-1 py-4 px-4 mt-4 rounded-[20px] max-w-3xl">
//         <div className="line-clamp-4">
//           <RichContent jsonContent={JSON.parse(activity.resource.message)} />
//         </div>
//       </div>
//     </ActivityItemContainer>
//   );
// }

function SectionTitle({ title }) {
  return <div className="font-bold flex items-center gap-2 py-4 border-t border-shade-1">{title}</div>;
}
