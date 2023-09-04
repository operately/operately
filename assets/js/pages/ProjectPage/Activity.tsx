import React from "react";

import { useBoolState } from "@/utils/useBoolState";

import * as Icons from "@tabler/icons-react";

import * as Updates from "@/graphql/Projects/updates";
import * as UpdateContent from "@/graphql/Projects/update_content";
import * as Projects from "@/graphql/Projects";
import * as People from "@/graphql/People";
import * as ProjectIcons from "@/components/ProjectIcons";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import ShortName from "@/components/ShortName";
import RichContent from "@/components/RichContent";
import Button from "@/components/Button";

import * as TipTapEditor from "@/components/Editor";
import * as Paper from "@/components/PaperContainer";

interface ActivityContextDescriptor {
  project: Projects.Project;
  refetch: () => Promise<any>;
}

const ActivityContext = React.createContext<ActivityContextDescriptor | null>(null);

export default function Activity({ project }): JSX.Element {
  const { data, loading, error, refetch } = Updates.useListUpdates({
    fetchPolicy: "network-only",
    variables: {
      filter: {
        projectId: project.id,
      },
    },
  });

  return (
    <ActivityContext.Provider value={{ project, refetch }}>
      <div className="min-h-[350px] mt-12">
        <SectionTitle />

        {loading && <div>Loading...</div>}
        {error && <div>{error.message}</div>}
        {data && <ActivityList updates={data.updates} project={project} />}
      </div>
    </ActivityContext.Provider>
  );
}

export function ActivityList({ project, updates }: { project: Projects.Project; updates: Updates.Update[] }) {
  return (
    <div className="flex flex-col gap-4 relative">
      <FeedLine />
      <NewMessage project={project} />

      {updates.map((update) => (
        <div key={update.id} className="z-20">
          <UpdateItem key={update.id} project={project} update={update} />
        </div>
      ))}
    </div>
  );
}

function FeedLine() {
  return <div className="absolute border-l border-shade-2 top-3 bottom-3 z-10" style={{ left: "69px" }}></div>;
}

function NewMessage({ project }) {
  const [active, _, activate, deactivate] = useBoolState(false);
  const [{ me }] = Paper.useLoadedData() as Paper.LoadedData;

  if (active) {
    return <NewMessageActive project={project} onBlur={deactivate} onPost={deactivate} me={me} />;
  } else {
    return (
      <div className="flex items-start">
        <FeedAvatar person={me} />

        <div
          className="cursor-pointer border rounded-lg border-dark-8 px-4 py-2 bg-dark-2 z-20 flex items-center gap-2 ml-4 flex-1 relative"
          onClick={activate}
          data-test-id="write-message"
        >
          <FeedAvatarCarrot fillColor="var(--color-dark-2)" />
          Write a message...
        </div>
      </div>
    );
  }
}

function NewMessageActive({ project, onBlur, onPost, me }) {
  const { refetch } = React.useContext(ActivityContext) as ActivityContextDescriptor;
  const [post, { loading }] = Updates.usePostUpdateMutation();
  const peopleSearch = People.usePeopleSearch();

  const editor = TipTapEditor.useEditor({
    placeholder: "Write a message...",
    peopleSearch: peopleSearch,
  });

  const handlePost = async () => {
    if (!editor) return;
    if (loading) return;

    await post({
      variables: {
        input: {
          updatableId: project.id,
          updatableType: "project",
          content: JSON.stringify(editor.getJSON()),
          messageType: "message",
        },
      },
    });

    await onPost();
    await refetch();
  };

  return (
    <TipTapEditor.Root>
      <div className="flex items-start">
        <FeedAvatar person={me} />

        <div className="border rounded-lg border-dark-8 p-4 bg-dark-2 z-20 flex-1 ml-4 relative">
          <FeedAvatarCarrot fillColor="var(--color-dark-2)" />

          <div className="text-white-1" style={{ minHeight: "200px" }}>
            <TipTapEditor.EditorContent editor={editor} />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button onClick={handlePost} loading={loading} variant="success" data-test-id="post-message" size="small">
                Post
              </Button>
              <Button variant="secondary" onClick={onBlur} size="small">
                Cancel
              </Button>
            </div>

            <TipTapEditor.Toolbar editor={editor} variant="small" />
          </div>

          <TipTapEditor.LinkEditForm editor={editor} />
        </div>
      </div>
    </TipTapEditor.Root>
  );
}

function UpdateItem({ project, update }: { project: Projects.Project; update: Updates.Update }) {
  switch (update.messageType) {
    case "message":
      return <Message project={project} update={update} />;

    case "status_update":
      return <StatusUpdate project={project} update={update} />;

    case "review":
      return <Review project={project} update={update as Updates.Review} />;

    case "project_created":
      return <ProjectCreated update={update} />;

    case "project_start_time_changed":
      return <ProjectStartTimeChanged update={update} />;

    case "project_end_time_changed":
      return <ProjectEndTimeChanged update={update} />;

    case "project_contributor_added":
      return <ProjectContributorAdded update={update} />;

    case "project_milestone_created":
      return <ProjectMilestoneCreated project={project} update={update} />;

    case "project_milestone_deleted":
      return <ProjectMilestoneDeleted project={project} update={update} />;

    case "project_milestone_completed":
      return <ProjectMilestoneCompleted project={project} update={update} />;

    case "project_milestone_deadline_changed":
      return <ProjectMilestoneDeadlineChanged project={project} update={update} />;

    default:
      console.log("Unknown update type: " + update.messageType);
      return null;
  }
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

function FeedAvatar({ person }) {
  return (
    <div className="border border-dark-8 bg-dark-3 rounded-full flex items-center justify-center mt-1.5">
      <Avatar person={person} size="small" />
    </div>
  );
}

function BigContainer({ project, update, person, time, children, tint = "gray" }) {
  const colors = ContainerColors[tint];
  const ackable = ["review", "status_update"].includes(update.messageType);

  return (
    <div className="flex items-start justify-between my-2">
      <FeedAvatar person={person} />

      <div className={"w-full border rounded-lg relative shadow-lg bg-dark-3 ml-4" + " " + colors.border}>
        <FeedAvatarCarrot fillColor="var(--color-dark-3)" />

        <div className="flex flex-col overflow-hidden">
          {ackable && <AckCTA update={update} project={project} />}

          <div className={"flex justify-between items-center"}>
            <div className="px-4 py-2 flex items-center gap-2">
              <span className="font-bold">{person.fullName}</span>
              <div className="border border-white-3 rounded-full px-1.5 text-xs font-medium">Champion</div>
            </div>

            <div className="mr-3 flex items-center gap-2">
              {ackable && <AckMarker update={update} />}
              <span className="text-white-2 text-sm">
                <FormattedTime time={time} format="relative" />
              </span>
            </div>
          </div>

          <div className="px-4">{children}</div>

          <div className="px-4 py-2 mt-2">
            <div className="flex justify-between items-center mb-3">
              <Icons.IconMoodPlus size={16} className="text-white-2 cursor-pointer" />
            </div>

            <div className="bg-dark-2 rounded-b-lg -mx-4 -mb-2 border-t-2 border-dark-5 text-white-2">
              <Comments update={update} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedAvatarCarrot({ fillColor }) {
  let width = 8;
  let height = 20;

  const points = [
    [0, height / 2],
    [width, 0],
    [width, height],
  ];

  const pointsString = points.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg height={height} width={width - 1} className="absolute" style={{ left: -width + 1 + "px", top: "10px" }}>
      <polygon
        points={pointsString}
        className={"fill-current stroke-current text-dark-8"}
        style={{ fill: fillColor, strokeWidth: 1 }}
      />
    </svg>
  );
}

function AckMarker({ update }) {
  if (update.acknowledged) {
    return <Icons.IconCircleCheckFilled size={16} className="text-green-400" data-test-id="acknowledged-marker" />;
  } else {
    return <Icons.IconCircleCheckFilled size={16} className="text-white-3" />;
  }
}

function AckCTA({ project, update }) {
  const { refetch } = React.useContext(ActivityContext) as ActivityContextDescriptor;
  const [{ me }] = Paper.useLoadedData();

  const [ack, { loading }] = Updates.useAckUpdate();

  if (update.acknowledged) return null;
  if (!project.reviewer) return null;
  if (project.reviewer.id !== me.id) return null;

  const handleAck = async () => {
    await ack({
      variables: {
        id: update.id,
      },
    });

    await refetch();
  };

  return (
    <div className="px-4 py-3 mb-2 border-b border-dark-8 flex items-center justify-between font-bold">
      Waiting for your acknowledgement
      <Button variant="success" size="tiny" data-test-id="acknowledge-update" loading={loading} onClick={handleAck}>
        <Icons.IconCheck size={16} className="-mr-1" stroke={3} />
        Acknowledge
      </Button>
    </div>
  );
}

function Comments({ update }) {
  const { beforeAck, afterAck } = Updates.splitCommentsBeforeAndAfterAck(update);

  return (
    <div className="flex flex-col">
      {beforeAck.map((c) => (
        <Comment key={c.id} comment={c} />
      ))}

      <AckComment update={update} />

      {afterAck.map((c) => (
        <Comment key={c.id} comment={c} />
      ))}

      <CommentBox update={update} />
    </div>
  );
}

function Comment({ comment }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 not-first:border-t border-shade-2 text-white-1">
      <div className="shrink-0">
        <Avatar person={comment.author} size="tiny" />
      </div>

      <div className="flex-1">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-bold -mt-0.5">{comment.author.fullName}</div>
            <span className="text-white-2 text-sm">
              <FormattedTime time={comment.insertedAt} format="relative" />
            </span>
          </div>
        </div>

        <div className="my-1">
          <RichContent jsonContent={JSON.parse(comment.message)} />
        </div>
      </div>
    </div>
  );
}

function AckComment({ update }) {
  if (!update.acknowledged) return null;

  const person = update.acknowledgingPerson;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 not-first:border-t border-shade-2 text-white-1 bg-green-400/10">
      <div className="shrink-0">
        <Icons.IconCircleCheckFilled size={20} className="text-green-400" />
      </div>

      <div className="flex-1">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>{person.fullName} acknowledged this update</div>
            <span className="text-white-2 text-sm">
              <FormattedTime time={update.acknowledgedAt} format="relative" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentBox({ update }) {
  const [active, _, activate, deactivate] = useBoolState(false);

  if (active) {
    return <AddCommentActive update={update} onBlur={deactivate} onPost={deactivate} />;
  } else {
    return <AddCommentNonActive onClick={activate} />;
  }
}

function AddCommentNonActive({ onClick }) {
  return (
    <div
      className="px-4 py-3 not-first:border-t border-dark-8 cursor-pointer"
      data-test-id="add-comment"
      onClick={onClick}
    >
      Post a comment...
    </div>
  );
}

function AddCommentActive({ update, onBlur, onPost }) {
  const { refetch } = React.useContext(ActivityContext) as ActivityContextDescriptor;

  const peopleSearch = People.usePeopleSearch();

  const editor = TipTapEditor.useEditor({
    placeholder: "Post a comment...",
    peopleSearch: peopleSearch,
  });

  const [post, { loading }] = Updates.usePostComment();

  const handlePost = async () => {
    if (!editor) return;
    if (loading) return;

    await post({
      variables: {
        input: {
          updateId: update.id,
          content: JSON.stringify(editor.getJSON()),
        },
      },
    });

    await onPost();
    await refetch();
  };

  return (
    <TipTapEditor.Root>
      <div className="px-4 py-3 not-first:border-t border-dark-8 overflow-hidden relative">
        <div className="text-white-1" style={{ minHeight: "200px" }}>
          <TipTapEditor.EditorContent editor={editor} />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button onClick={handlePost} loading={loading} variant="success" data-test-id="post-comment" size="small">
              Post
            </Button>

            <Button variant="secondary" onClick={onBlur} size="small">
              Cancel
            </Button>
          </div>

          <TipTapEditor.Toolbar editor={editor} variant="small" />
        </div>

        <TipTapEditor.LinkEditForm editor={editor} />
      </div>
    </TipTapEditor.Root>
  );
}

function Message({ project, update }: { project: Projects.Project; update: Updates.Update }) {
  const content = update.content as Updates.Message;
  const message = content.message;

  return (
    <BigContainer update={update} person={update.author} time={update.insertedAt} project={project}>
      <RichContent jsonContent={message} />
    </BigContainer>
  );
}

function StatusUpdate({ project, update }: { project: Projects.Project; update: Updates.Update }) {
  const content = update.content as Updates.StatusUpdate;
  const message = content.message;

  const oldHealth = content.oldHealth;
  const newHealth = content.newHealth;

  return (
    <BigContainer update={update} person={update.author} time={update.insertedAt} project={project}>
      {oldHealth !== newHealth && (
        <div className="flex">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              Project health changed from
              <div className="bg-dark-2 rounded-lg px-2 py-1 flex items-center gap-2 text-sm">
                <ProjectIcons.IconForHealth health={oldHealth} /> <span className="capitalize">{oldHealth}</span>
              </div>
              -&gt;
              <div className="bg-dark-2 rounded-lg px-2 py-1 flex items-center gap-2 text-sm">
                <ProjectIcons.IconForHealth health={newHealth} /> <span className="capitalize">{newHealth}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <RichContent jsonContent={message} />
    </BigContainer>
  );
}

function ProjectCreated({ update }: { update: Updates.Update }) {
  const content = update.content as Updates.UpdateContentProjectCreated;

  const creatorIsChampion = content.creator.id === content.champion.id;

  const creator = (
    <span className="font-extrabold text-white-1">
      <ShortName fullName={content.creator.fullName} />
    </span>
  );

  const action = " created this project ";

  const champion = (
    <span className="font-extrabold text-white-1">
      <ShortName fullName={content.champion.fullName} />
    </span>
  );

  let assignements: string | JSX.Element = "";

  if (creatorIsChampion) {
    assignements = "and assigned themselves as the Champion";
  } else if (content.creatorRole) {
    assignements = (
      <>
        with {champion} as the champion and themselves as a {content.creatorRole}
      </>
    );
  } else {
    assignements = <> and assigned {champion} as the champion</>;
  }

  return (
    <SmallContainer time={update.insertedAt}>
      <div className="text-white-4">
        {creator}
        {action}
        {assignements}.
      </div>
    </SmallContainer>
  );
}

function ProjectMilestoneCreated({ update }: { project: Projects.Project; update: Updates.Update }) {
  const creator = update.author;

  const content = update.content as UpdateContent.ProjectMilestoneCreated;
  const milestone = content.milestone.title;

  return (
    <SmallContainer time={update.insertedAt}>
      <div className="text-white-4">
        <span className="font-extrabold text-white-1">
          <ShortName fullName={creator.fullName} />
        </span>{" "}
        added <Icons.IconMapPinFilled size={16} className="text-white-1/60 inline-block -mt-1" />{" "}
        <span className="font-extrabold text-white-1">{milestone}</span> milestone.
      </div>
    </SmallContainer>
  );
}

function ProjectStartTimeChanged({ update }: { update: Updates.Update }) {
  const creator = update.author;
  const content = update.content as UpdateContent.ProjectStartTimeChanged;

  return (
    <SmallContainer time={update.insertedAt}>
      <div className="text-white-4">
        <span className="font-extrabold text-white-1">
          <ShortName fullName={creator.fullName} />
        </span>{" "}
        changed the project's start date to <FormattedTime time={content.newStartTime} format="short-date" />.
      </div>
    </SmallContainer>
  );
}

function ProjectEndTimeChanged({ update }: { update: Updates.Update }) {
  const creator = update.author;
  const content = update.content as UpdateContent.ProjectEndTimeChanged;

  return (
    <SmallContainer time={update.insertedAt}>
      <div className="text-white-4">
        <span className="font-extrabold text-white-1">
          <ShortName fullName={creator.fullName} />
        </span>{" "}
        changed the project's due date to <FormattedTime time={content.newEndTime} format="short-date" />.
      </div>
    </SmallContainer>
  );
}

function ProjectContributorAdded({ update }: { update: Updates.Update }) {
  const creator = update.author;
  const content = update.content as UpdateContent.ProjectContributorAdded;

  return (
    <SmallContainer time={update.insertedAt}>
      <div className="text-white-4">
        <span className="font-extrabold text-white-1">
          <ShortName fullName={creator.fullName} />
        </span>{" "}
        added{" "}
        <span className="font-extrabold text-white-1">
          <ShortName fullName={content.contributor.fullName} />
        </span>{" "}
        to the project.
      </div>
    </SmallContainer>
  );
}

function ProjectMilestoneDeleted({ update }: { project: Projects.Project; update: Updates.Update }) {
  const creator = update.author;

  const content = update.content as UpdateContent.ProjectMilestoneDeleted;
  const milestone = content.milestone.title;

  return (
    <SmallContainer time={update.insertedAt}>
      <div className="text-white-4">
        <span className="font-extrabold text-white-1">
          <ShortName fullName={creator.fullName} />
        </span>{" "}
        deleted the <Icons.IconMapPinFilled size={16} className="text-white-1/60 inline-block -mt-1" />{" "}
        <span className="font-extrabold text-white-1">{milestone}</span> milestone.
      </div>
    </SmallContainer>
  );
}

function ProjectMilestoneCompleted({ update }: { project: Projects.Project; update: Updates.Update }) {
  const creator = update.author;

  const content = update.content as Updates.ProjectMilestoneCompleted;
  const milestone = content.milestone.title;

  return (
    <SmallContainer time={update.insertedAt}>
      <div className="text-white-4">
        <span className="font-extrabold text-white-1">
          <ShortName fullName={creator.fullName} />
        </span>{" "}
        marked <Icons.IconMapPinFilled size={16} className="text-green-400 inline-block -mt-1" />{" "}
        <span className="font-extrabold text-white-1">{milestone}</span> as completed.
      </div>
    </SmallContainer>
  );
}

function ProjectMilestoneDeadlineChanged({ update }: { project: Projects.Project; update: Updates.Update }) {
  const creator = update.author;

  const content = update.content as Updates.ProjectMilestoneDeadlineChanged;
  const milestone = content.milestone.title;

  return (
    <SmallContainer time={update.insertedAt}>
      <div className="text-white-4">
        <span className="font-extrabold text-white-1">
          <ShortName fullName={creator.fullName} />
        </span>{" "}
        changed the due date for <Icons.IconMapPinFilled size={16} className="text-green-400 inline-block -mt-1" />{" "}
        <span className="font-extrabold text-white-1">{milestone}</span> to{" "}
        <FormattedTime time={content.newDeadline} format="short-date" />.
      </div>
    </SmallContainer>
  );
}

function SmallContainer({ time, children }) {
  return (
    <div className="flex items-start justify-between my-2 mr-1 text-sm">
      <div
        className="bg-dark-3 rounded-full flex items-center justify-center"
        style={{
          marginLeft: "55px",
          marginRight: "5px",
          width: "30px",
          height: "30px",
          marginTop: "-5px",
        }}
      >
        <div className="w-2.5 h-2.5 bg-dark-8 border border-white-2 rounded-full"></div>
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
    <BigContainer update={update} person={update.author} time={update.insertedAt} project={project}>
      <Message />
    </BigContainer>
  );
}

function SectionTitle() {
  return (
    <div className="font-bold flex items-center gap-4 py-4 pb-8">
      <div className="flex-1 bg-dark-8" style={{ height: "1px" }}></div>
      <div className="font-bold text-xl">Activity</div>
      <div className="flex-1 bg-dark-8" style={{ height: "1px" }}></div>
    </div>
  );
}
