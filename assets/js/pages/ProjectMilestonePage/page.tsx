import React from "react";
import * as Icons from "@tabler/icons-react";
import * as Pages from "@/components/Pages";

import * as Time from "@/utils/time";

import * as People from "@/graphql/People";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Paper from "@/components/PaperContainer";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";
import * as TipTapEditor from "@/components/Editor";
import Button, { IconButton } from "@/components/Button";
import Avatar from "@/components/Avatar";
import * as Popover from "@radix-ui/react-popover";
import DatePicker from "react-datepicker";

import { useBoolState } from "@/utils/useBoolState";
import { useLoadedData, useRefresh } from "./loader";
import { ProjectMilestonesNavigation } from "@/components/ProjectPageNavigation";
import { ButtonLink } from "@/components/Link";

export function Page() {
  const { project, milestone, me } = useLoadedData();
  const refetch = useRefresh();

  return (
    <Pages.Page title={[milestone.title, project.name]}>
      <Paper.Root size="medium">
        <ProjectMilestonesNavigation project={project} />

        <Paper.Body minHeight="none">
          <div className="flex items-center gap-2 mb-8">
            <MilestoneName milestone={milestone} />
          </div>

          <div className="flex items-center gap-12 mb-4">
            <Status milestone={milestone} />
            <DueDate milestone={milestone} />
          </div>

          <div className="border-t border-stroke-base mb-8 pt-4 text-sm">
            <Description milestone={milestone} refetch={refetch} />
          </div>

          <Comments milestone={milestone} me={me} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Status({ milestone }) {
  let title = "";
  let color = "";

  if (Milestones.isOverdue(milestone)) {
    title = "Overdue";
    color = "text-red-500";
  }
  if (Milestones.isUpcoming(milestone)) {
    title = "Upcoming";
    color = "text-green-500";
  }
  if (Milestones.isDone(milestone)) {
    title = "Completed";
    color = "text-purple-500";
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="uppercase text-xs font-semibold text-content-dimmed">Status</div>
      <div className="flex items-center gap-1">
        <Icons.IconCircleFilled size={16} className={color} />
        <div className="font-medium text-content-accent leading-none">{title}</div>
      </div>
    </div>
  );
}

function DueDate({ milestone }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="uppercase text-xs font-semibold text-content-dimmed">Due Date</div>
      <div className="flex items-center gap-1">
        <div className="font-medium text-content-accent leading-none">
          <FormattedTime time={milestone.deadlineAt} format="short-date-with-weekday" />
        </div>
      </div>
    </div>
  );
}

function DetailList({ children }) {
  return <div className="flex flex-col border-b border-stroke-base">{children}</div>;
}

function DetailListItem({ title, value }) {
  return (
    <div className="flex items-start gap-4 py-6 border-t border-stroke-base text-sm">
      <div className="font-semibold text-content-accent w-1/5">{title}</div>

      <div className="flex-1">{value}</div>
    </div>
  );
}

function Description({ milestone, refetch }) {
  const [editing, _, setEditing, setNotEditing] = useBoolState(false);

  if (editing) {
    return <DescriptionEdit milestone={milestone} onSave={setNotEditing} onCancel={setNotEditing} refetch={refetch} />;
  } else {
    if (milestone.description) {
      return <DescriptionFilled milestone={milestone} onEdit={setEditing} />;
    } else {
      return <DescriptionZeroState onEdit={setEditing} />;
    }
  }
}

function DescriptionZeroState({ onEdit }) {
  return (
    <div>
      <div className="text-content-dimmed">No description yet</div>

      <div className="font-semibold mt-1">
        <ButtonLink onClick={onEdit} data-test-id="write-milestone-description">
          Add description
        </ButtonLink>
      </div>
    </div>
  );
}

function DescriptionFilled({ milestone, onEdit }) {
  return (
    <div className="relative group hover:bg-surface-accent p-1.5 -m-1.5" data-test-id="milestone-description">
      <div style={{ width: "calc(100% - 2rem)" }}>
        <RichContent jsonContent={milestone.description} />
      </div>

      <div className="absolute top-1.5 right-1 opacity-0 group-hover:opacity-100">
        <IconButton
          color="green"
          size="sm"
          tooltip="Edit description"
          onClick={onEdit}
          icon={<Icons.IconEdit size={16} />}
          data-test-id="edit-milestone-description"
        ></IconButton>
      </div>
    </div>
  );
}

function DescriptionEdit({ milestone, onSave, onCancel, refetch }) {
  const peopleSearch = People.usePeopleSearch();

  const { editor, submittable, empty } = TipTapEditor.useEditor({
    placeholder: "Write here...",
    content: JSON.parse(milestone.description || "{}"),
    editable: true,
    className: "pb-2 min-h-[200px]",
    peopleSearch: peopleSearch,
  });

  const [post, { loading }] = Milestones.useUpdateDescription();

  const handlePost = async () => {
    if (!editor) return;
    if (!submittable) return;
    if (loading) return;

    const content = empty ? null : JSON.stringify(editor.getJSON());

    await post({
      variables: {
        input: {
          id: milestone.id,
          description: content,
        },
      },
    });

    await onSave();
    refetch();
  };

  return (
    <div
      className="border-x border-b border-stroke-base rounded relative overflow-hidden"
      data-test-id="milestone-description-editor"
    >
      <TipTapEditor.Root>
        <TipTapEditor.Toolbar editor={editor} variant="large" />

        <div className="p-2">
          <TipTapEditor.EditorContent editor={editor} className="min-h-[200px]" />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePost}
                loading={loading}
                disabled={!submittable}
                variant="success"
                data-test-id="save-milestone-description"
                size="small"
              >
                {submittable ? "Save" : "Uploading..."}
              </Button>

              <Button variant="secondary" size="small" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <TipTapEditor.LinkEditForm editor={editor} />
      </TipTapEditor.Root>
    </div>
  );
}

function Comments({ milestone, me }) {
  return (
    <div className="-mx-12 px-12 -mb-10 pb-10 rounded-b bg-surface-dimmed border-t border-surface-outline">
      <h1 className="uppercase text-xs font-semibold text-content-accent pb-4 mt-8">Comments</h1>

      {milestone.comments.map((comment) => (
        <React.Fragment key={comment.id}>
          <Comment key={comment.id} comment={comment.comment} />
          {comment.action === "complete" && <CompletedComment comment={comment.comment} />}
          {comment.action === "reopen" && <ReopenedComment comment={comment.comment} />}
        </React.Fragment>
      ))}

      <AddComment milestone={milestone} me={me} />
    </div>
  );
}

function Comment({ comment }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent">
      <div className="shrink-0">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-bold -mt-0.5">{comment.author.fullName}</div>
            <span className="text-content-dimmed text-sm">
              <FormattedTime time={comment.insertedAt} format="relative" />
            </span>
          </div>
        </div>

        <div className="mb-1">
          <RichContent jsonContent={comment.message} />
        </div>
      </div>
    </div>
  );
}

function CompletedComment({ comment }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent">
      <div className="shrink-0">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-bold -mt-0.5"></div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <Icons.IconSquareCheckFilled size={20} className="text-accent-1" />
            <div className="flex-1 pr-2 font-semibold text-content-accent">Completed the Milestone</div>
          </div>

          <span className="text-content-dimmed text-sm">
            <FormattedTime time={comment.insertedAt} format="relative" />
          </span>
        </div>
      </div>
    </div>
  );
}

function ReopenedComment({ comment }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent">
      <div className="shrink-0">
        <Avatar person={comment.author} size="normal" />
      </div>

      <div className="flex-1">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-bold -mt-0.5"></div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <Icons.IconSquareChevronsLeftFilled size={20} className="text-yellow-500" />
            <div className="flex-1 pr-2 font-semibold text-content-accent">Re-Opened the Milestone</div>
          </div>

          <span className="text-content-dimmed text-sm">
            <FormattedTime time={comment.insertedAt} format="relative" />
          </span>
        </div>
      </div>
    </div>
  );
}

function AddComment({ milestone, me }) {
  const [active, _, activate, deactivate] = useBoolState(false);

  if (active) {
    return <AddCommentActive milestone={milestone} me={me} />;
  } else {
    return <AddCommentInactive activate={activate} me={me} />;
  }
}

function AddCommentInactive({ me, activate }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent">
      <div className="shrink-0">
        <Avatar person={me} size="normal" />
      </div>

      <div className="flex-1 text-content-dimmed mt-1 cursor-pointer" onClick={activate}>
        Add a comment...
      </div>
    </div>
  );
}

function AddCommentActive({ milestone, me, deactivate }) {
  const refetch = useRefresh();

  const { editor, submittable, focused, empty } = TipTapEditor.useEditor({
    peopleSearch: People.usePeopleSearch(),
    placeholder: "Leave a comment...",
    className: "px-2 py-1.5 min-h-[150px]",
  });

  const [post, { loading }] = Milestones.usePostComment();

  const submit = async (action: "none" | "complete" | "reopen") => {
    if (!editor) return;
    if (!submittable) return;
    if (loading) return;

    const content = empty ? null : JSON.stringify(editor.getJSON());

    await post({
      variables: {
        input: {
          milestoneID: milestone.id,
          content: content,
          action: action,
        },
      },
    });

    editor.commands.clearContent(true);
    deactivate();
    refetch();
  };

  const avatar = <Avatar person={me} size="small" />;
  const commentBox = (
    <div data-test-id="milestone-comment-editor">
      <TipTapEditor.Root>
        <div className="rounded relative border-x border-b border-stroke-base">
          <TipTapEditor.Toolbar editor={editor} variant="large" />
          <TipTapEditor.EditorContent editor={editor} />
          <div className={"p-2 flex flex-row-reverse" + " " + (focused ? "opacity-100" : "opacity-0")}></div>
          <TipTapEditor.LinkEditForm editor={editor} />
        </div>
      </TipTapEditor.Root>

      <div className="flex flex-row-reverse gap-2 mt-3">
        <Button variant="success" disabled={!submittable} onClick={() => submit("none")} data-test-id="post-comment">
          {submittable ? "Comment" : "Uploading..."}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex items-start justify-between gap-3 py-3 not-first:border-t border-stroke-base text-content-accent">
      <div className="shrink-0">{avatar}</div>

      <div className="flex-1">{commentBox}</div>
    </div>
  );
}

// function DueDate({ milestone }) {
//   const [_, refetch] = Paper.useLoadedData() as [LoaderResult, () => void, number];
//   const [open, setOpen] = React.useState(false);

//   let deadline = Time.parseISO(milestone.deadlineAt);

//   const [update] = Milestones.useSetDeadline();

//   const change = async (date: Date | null) => {
//     const deadline = date ? Time.toDateWithoutTime(date) : null;

//     await update({
//       variables: {
//         milestoneId: milestone.id,
//         deadlineAt: deadline,
//       },
//     });

//     setOpen(false);
//     refetch();
//   };

//   return (
//     <Popover.Root open={open} onOpenChange={setOpen}>
//       <Popover.Trigger asChild>
//         <div
//           className="hover:bg-surface-accent -m-1.5 p-1.5 relative group cursor-pointer w-full outline-none"
//           onClick={() => setOpen(true)}
//           data-test-id="change-milestone-due-date"
//         >
//           <FormattedTime time={milestone.deadlineAt} format="short-date-with-weekday-relative" />
//           {!Milestones.isDone(milestone) && <DueDateExplanation milestone={milestone} />}
//         </div>
//       </Popover.Trigger>

//       <Popover.Portal>
//         <Popover.Content className="outline-red-400 border border-stroke-base" align="start">
//           <DatePicker inline selected={deadline} onChange={change} className="border-none"></DatePicker>
//         </Popover.Content>
//       </Popover.Portal>
//     </Popover.Root>
//   );
// }

// function DueDateExplanation({ milestone }) {
//   if (Milestones.isDone(milestone)) return null;
//   if (!Milestones.isOverdue(milestone)) return null;

//   const deadline = Time.parseISO(milestone.deadlineAt);

//   return (
//     <>
//       <TextSeparator />
//       <span className="text-red-500 font-bold">
//         <TimeToDueDate dueDate={deadline} />
//       </span>
//     </>
//   );
// }

function TimeToDueDate({ dueDate }: { dueDate: Date }) {
  const days = Time.daysBetween(Time.today(), dueDate);

  if (days < -365) return <>Overdue for more than a year</>;
  if (days < -60) return <>Overdue for more than {-Math.round(days / 30)} months</>;
  if (days < -30) return <>Overdue for more than a month</>;
  if (days < -14) return <>Overdue for more than {-Math.round(days / 7)} weeks</>;
  if (days < -1) return <>Overdue {-days} days</>;
  if (days === -1) return <>Overdue 1 day</>;
  if (days === 0) return <>Due today</>;
  if (days === 1) return <>Due tomorrow</>;
  if (days < 7) return <>Due in {days} days</>;
  if (days < 14) return <>Due in a week</>;
  if (days < 30) return <>Due in {Math.round(days / 7)} weeks</>;
  if (days < 60) return <>Due in a month</>;
  if (days < 365) return <>Due in {Math.round(days / 30)} months</>;
  if (days < 730) return <>Due in a year</>;

  return <>Due {Math.round(days / 365)} years</>;
}

function TextSeparator() {
  return <span className="mx-1">&middot;</span>;
}

function MilestoneName({ milestone }) {
  const [editing, _, activate, deactivate] = useBoolState(false);

  if (editing) {
    return <MilestoneNameEdit onSave={deactivate} milestone={milestone} onCancel={deactivate} />;
  } else {
    return <MilestoneNameFilled startEditing={activate} milestone={milestone} />;
  }
}

function MilestoneNameFilled({ milestone, startEditing }) {
  return (
    <div
      className="text-2xl font-extrabold text-content-accent hover:bg-shade-1 flex-1 cursor-pointer -m-1.5 p-1.5"
      onClick={startEditing}
      data-test-id="edit-milestone-title"
    >
      {milestone.title}
    </div>
  );
}

function MilestoneNameEdit({ milestone, onSave, onCancel }) {
  const refetch = useRefresh();
  const [update] = Milestones.useUpdateTitle();
  const [title, setTitle] = React.useState(milestone.title);

  const handleSave = async () => {
    await update({
      variables: {
        input: {
          id: milestone.id,
          title: title,
        },
      },
    });

    refetch();
    onSave();
  };

  return (
    <div className="flex items-center gap-2 w-full bg-shade-1 -m-1.5 p-1.5">
      <input
        type="text"
        className="text-2xl font-extrabold border-none outline-none bg-transparent w-full text-content-accent p-0 flex-1 block focus:ring-0"
        defaultValue={milestone.title}
        title={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        data-test-id="milestone-title-input"
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            handleSave();
          }
        }}
      />

      <IconButton
        color="green"
        tooltip="Save"
        onClick={handleSave}
        icon={<Icons.IconCheck size={16} />}
        data-test-id="save-milestone-title"
      ></IconButton>

      <IconButton
        color="red"
        tooltip="Cancel"
        onClick={onCancel}
        icon={<Icons.IconX size={16} />}
        data-test-id="cancel-edit-milestone-title"
      ></IconButton>
    </div>
  );
}
