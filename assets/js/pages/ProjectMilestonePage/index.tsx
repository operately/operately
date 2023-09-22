import React from "react";
import * as Icons from "@tabler/icons-react";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as People from "@/graphql/People";
import * as Me from "@/graphql/Me";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Paper from "@/components/PaperContainer";
import FormattedTime from "@/components/FormattedTime";
import RichContent from "@/components/RichContent";
import * as TipTapEditor from "@/components/Editor";
import Button, { IconButton } from "@/components/Button";
import Avatar from "@/components/Avatar";

import { useDocumentTitle } from "@/layouts/header";
import { useBoolState } from "@/utils/useBoolState";

interface LoaderResult {
  project: Projects.Project;
  milestone: Milestones.Milestone;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  let milestoneData = await client.query({
    query: Milestones.GET_MILESTONE,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  let meData = await client.query({
    query: Me.GET_ME,
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
    milestone: milestoneData.data.milestone,
    me: meData.data.me,
  };
}

export function Page() {
  const [{ project, milestone, me }, refetch, fetchVersion] = Paper.useLoadedData() as [
    LoaderResult,
    () => void,
    number,
  ];

  useDocumentTitle(`${milestone.title} - ${project.name}`);

  return (
    <Paper.Root key={fetchVersion}>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <div className="flex items-center gap-4">
          <div className="w-28 flex flex-row-reverse">
            <Icons.IconMapPinFilled size={24} />
          </div>

          <div className="text-2xl font-extrabold text-white-1">{milestone.title}</div>
        </div>

        <Separator />

        <DetailList>
          <DetailListItem title="Status" value={<StatusBadge milestone={milestone} />} />
          <DetailListItem title="Due Date" value={<FormattedTime time={milestone.deadlineAt} format="short-date" />} />
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
        <div className="bg-red-600 rounded font-bold text-white-1 px-1 text-sm inline-block uppercase tracking-wide -my-0.5">
          Overdue
        </div>
      );
    } else {
      return (
        <div className="bg-emerald-600 rounded font-bold text-white-1 px-1 text-sm inline-block uppercase tracking-wide -my-0.5">
          Upcoming
        </div>
      );
    }
  } else {
    return (
      <div className="bg-purple-500 rounded font-bold text-white-1 px-1 text-sm inline-block uppercase tracking-wide -my-0.5">
        Completed
      </div>
    );
  }
}

function Separator() {
  return <div className="border-b border-dark-5 mt-4" />;
}

function DetailList({ children }) {
  return <div className="flex flex-col">{children}</div>;
}

function DetailListItem({ title, value }) {
  return (
    <div className="flex items-start gap-4 pt-2 mt-2">
      <div className="font-extrabold text-white-1 w-28 flex flex-row-reverse">{title}</div>

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
    <a className="text-white-2 font-normal cursor-pointer" onClick={onEdit} data-test-id="write-milestone-description">
      Add details or attach files...
    </a>
  );
}

function DescriptionFilled({ milestone, onEdit }) {
  return (
    <div className="relative group" data-test-id="milestone-description">
      <RichContent jsonContent={milestone.description} />

      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <IconButton
          color="green"
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

  const { editor, submittable } = TipTapEditor.useEditor({
    placeholder: "Write here...",
    content: JSON.parse(milestone.description || "{}"),
    editable: true,
    className: "py-2 min-h-[200px]",
    peopleSearch: peopleSearch,
  });

  const [post, { loading }] = Milestones.useUpdateDescription();

  const handlePost = async () => {
    if (!editor) return;
    if (!submittable) return;
    if (loading) return;

    await post({
      variables: {
        input: {
          id: milestone.id,
          description: JSON.stringify(editor.getJSON()),
        },
      },
    });

    await onSave();
    refetch();
  };

  return (
    <div className="border border-dark-5 bg-dark-2 rounded px-4 p-4 pt-2 relative overflow-hidden">
      <TipTapEditor.Root>
        <TipTapEditor.EditorContent editor={editor} className="min-h-[200px]" />
        <div className="flex justify-between items-center mt-4">
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

          <TipTapEditor.Toolbar editor={editor} variant="small" />
        </div>
        <TipTapEditor.LinkEditForm editor={editor} />
      </TipTapEditor.Root>
    </div>
  );
}

function Comments({ milestone, refetch }) {
  return <></>;
}

function AddComment({ milestone, refetch, me }) {
  const { editor, submittable, focused, empty } = TipTapEditor.useEditor({
    peopleSearch: People.usePeopleSearch(),
    placeholder: "Leave a comment...",
    className: "px-2 py-1.5 min-h-[150px]",
  });

  const [post, { loading }] = Milestones.usePostComment();

  const submit = async (action: "comment" | "complete") => {
    if (!editor) return;
    if (!submittable) return;
    if (loading) return;

    await post({
      variables: {
        input: {
          milestoneID: milestone.id,
          content: JSON.stringify(editor.getJSON()),
          action: action,
        },
      },
    });

    await refetch();
  };

  const avatar = <Avatar person={me} size="small" />;
  const commentBox = (
    <div>
      <TipTapEditor.Root>
        <div className="bg-dark-2 rounded relative">
          <TipTapEditor.EditorContent editor={editor} />
          <div className={"p-2 flex flex-row-reverse" + " " + (focused ? "opacity-100" : "opacity-0")}>
            <TipTapEditor.Toolbar editor={editor} variant="small" />
          </div>
          <TipTapEditor.LinkEditForm editor={editor} />
        </div>
      </TipTapEditor.Root>

      <div className="flex flex-row-reverse gap-2 mt-3 mr-1">
        <Button variant="success" disabled={!submittable} onClick={() => submit("comment")}>
          {submittable ? "Comment" : "Uploading..."}
        </Button>

        {submittable && (
          <Button variant="secondary" onClick={() => submit("complete")}>
            <Icons.IconChecks size={16} />
            {empty ? "Complete Milestone" : "Complete with comment"}
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
