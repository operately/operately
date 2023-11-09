import React from "react";
import * as Icons from "@tabler/icons-react";

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

import { useDocumentTitle } from "@/layouts/header";
import { useBoolState } from "@/utils/useBoolState";

import { useLoadedData, useRefresh } from "./loader";

export function Page() {
  const { project, milestone, me } = useLoadedData();
  const refetch = useRefresh();

  useDocumentTitle(`${milestone.title} - ${project.name}`);

  return (
    <Paper.Root>
      <Navigation project={project} />

      <Paper.Body>
        <div className="flex items-start gap-4">
          <div className="w-32 flex flex-row-reverse shrink-0 mt-1">
            <Icons.IconFlagFilled size={24} className="text-yellow-400" />
          </div>

          <MilestoneName milestone={milestone} />
        </div>

        <Separator />

        <DetailList>
          <DetailListItem title="Status" value={<StatusBadge milestone={milestone} />} />
          <DetailListItem title="Due Date" value={<DueDate milestone={milestone} />} />
          <DetailListItem title="Description" value={<Description milestone={milestone} refetch={refetch} />} />
        </DetailList>

        <Separator />

        <Comments milestone={milestone} refetch={refetch} />

        <AddComment milestone={milestone} refetch={refetch} me={me} />
      </Paper.Body>
    </Paper.Root>
  );
}

function StatusBadge({ milestone }) {
  if (milestone.status === "pending") {
    if (Milestones.isOverdue(milestone)) {
      return (
        <div className="bg-red-600 rounded font-bold text-content-accent px-1 text-sm inline-block uppercase tracking-wide -my-0.5">
          Overdue
        </div>
      );
    } else {
      return (
        <div className="bg-emerald-600 rounded font-bold text-content-accent px-1 text-sm inline-block uppercase tracking-wide -my-0.5">
          Upcoming
        </div>
      );
    }
  } else {
    return (
      <div className="bg-purple-500 rounded font-bold text-content-accent px-1 text-sm inline-block uppercase tracking-wide -my-0.5">
        Completed
      </div>
    );
  }
}

function Separator() {
  return <div className="border-b border-stroke-base mt-4" />;
}

function DetailList({ children }) {
  return <div className="flex flex-col">{children}</div>;
}

function DetailListItem({ title, value }) {
  return (
    <div className="flex items-start gap-4 pt-2 mt-2">
      <div className="font-extrabold text-content-accent w-32 flex flex-row-reverse">{title}</div>

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
    <a
      className="text-content-dimmed font-normal cursor-pointer hover:bg-surface-accent p-1.5 -m-1.5 w-full block"
      onClick={onEdit}
      data-test-id="write-milestone-description"
    >
      Add details or attach files...
    </a>
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

function Comments({ milestone, refetch }) {
  return (
    <>
      {milestone.comments.map((comment) => (
        <Comment key={comment.id} comment={comment} refetch={refetch} />
      ))}
    </>
  );
}

function Comment({ comment }) {
  return (
    <div className="border-b border-stroke-base">
      <div className="flex items-start gap-4 py-4 ">
        <div className="w-32 flex justify-between items-center pl-2">
          <div className="text-content-dimmed text-xs">
            <div className="uppercase">
              {Time.isToday(Time.parseISO(comment.comment.insertedAt)) ? (
                "Today"
              ) : (
                <FormattedTime time={comment.comment.insertedAt} format="short-date" />
              )}
            </div>

            <div className="">
              <FormattedTime time={comment.comment.insertedAt} format="time-only" />
            </div>
          </div>

          <Avatar person={comment.comment.author} size="small" />
        </div>
        <div className="flex-1 pr-2">
          <div className="text-content-accent font-bold">{comment.comment.author.fullName}</div>

          <RichContent jsonContent={comment.comment.message} />
        </div>
      </div>
      {comment.action === "complete" && (
        <div className="flex items-center gap-4 pb-4">
          <div className="w-32 flex justify-between items-center pl-2">
            <div></div>
            <Icons.IconCircleCheck size={20} className="text-purple-400" />
          </div>
          <div className="flex-1 pr-2 font-semibold text-purple-300">Milestone Completed</div>
        </div>
      )}

      {comment.action === "reopen" && (
        <div className="flex items-center gap-4 pb-4">
          <div className="w-32 flex justify-between items-center pl-2">
            <div></div>
            <Icons.IconRefresh size={20} className="text-emerald-600" />
          </div>
          <div className="flex-1 pr-2 font-semibold text-emerald-300">Milestone Re-Opened</div>
        </div>
      )}
    </div>
  );
}

function AddComment({ milestone, refetch, me }) {
  const { editor, submittable, focused, empty } = TipTapEditor.useEditor({
    peopleSearch: People.usePeopleSearch(),
    placeholder: "Leave a comment...",
    className: "px-2 py-1.5 min-h-[150px]",
  });

  const [post, { loading }] = Milestones.usePostComment();

  const action = milestone.status === "done" ? "reopen" : "complete";
  const actionMessage = action === "reopen" ? "Re-open" : "Complete";
  const actionIcon =
    action === "reopen" ? (
      <Icons.IconRefresh size={16} className="text-emerald-600" />
    ) : (
      <Icons.IconCheck size={16} className="text-purple-500" />
    );

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

    await refetch();
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

        {submittable && (
          <Button variant="secondary" onClick={() => submit(action)} data-test-id={action + "-and-comment"}>
            {actionIcon}
            {empty ? actionMessage + " Milestone" : actionMessage + " with comment"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <DetailList>
      <DetailListItem title={avatar} value={commentBox} />
    </DetailList>
  );
}

function DueDate({ milestone }) {
  const [_, refetch] = Paper.useLoadedData() as [LoaderResult, () => void, number];
  const [open, setOpen] = React.useState(false);

  let deadline = Time.parseISO(milestone.deadlineAt);

  const [update] = Milestones.useSetDeadline();

  const change = async (date: Date | null) => {
    const deadline = date ? Time.toDateWithoutTime(date) : null;

    await update({
      variables: {
        milestoneId: milestone.id,
        deadlineAt: deadline,
      },
    });

    setOpen(false);
    refetch();
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div
          className="hover:bg-surface-accent -m-1.5 p-1.5 relative group cursor-pointer w-full outline-none"
          onClick={() => setOpen(true)}
          data-test-id="change-milestone-due-date"
        >
          <FormattedTime time={milestone.deadlineAt} format="short-date-with-weekday-relative" />
          {!Milestones.isDone(milestone) && <TextSeparator />}
          {!Milestones.isDone(milestone) && <DueDateExplanation milestone={milestone} />}
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="outline-red-400 border border-stroke-base" align="start">
          <DatePicker inline selected={deadline} onChange={change} className="border-none"></DatePicker>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function DueDateExplanation({ milestone }) {
  const deadline = Time.parseISO(milestone.deadlineAt);
  const color = Milestones.isOverdue(milestone) ? "text-red-400" : "text-emerald-400";

  return (
    <span className={color}>
      <TimeToDueDate dueDate={deadline} />
    </span>
  );
}

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

function Navigation({ project }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/projects/${project.id}`}>
        <Icons.IconClipboardList size={16} />
        {project.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}
