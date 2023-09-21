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
import Button from "@/components/Button";

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
  const [{ project, milestone }, refetch, fetchVersion] = Paper.useLoadedData() as [LoaderResult, () => void, number];

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
        <div className="text-3xl font-bold leading-none">{milestone.title}</div>

        <DetailList>
          <DetailListItem title="Status" value={milestone.status === "pending" ? "Open" : "Completed"} />
          <DetailListItem title="Due Date" value={<FormattedTime time={milestone.deadlineAt} format="short-date" />} />

          {milestone.status === "done" && (
            <DetailListItem
              title="Completed"
              value={<FormattedTime time={milestone.completedAt} format="short-date" />}
            />
          )}
        </DetailList>

        <Description milestone={milestone} refetch={refetch} />
      </Paper.Body>
    </Paper.Root>
  );
}

function DetailList({ children }) {
  return <div className="flex flex-col gap-1 my-4">{children}</div>;
}

function DetailListItem({ title, value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="font-bold w-24">{title}:</div>

      <div className="font-medium">{value}</div>
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
    <div className="border-y border-dark-5 my-4 py-2 min-h-[200px]">
      <span className="text-white-2">
        No description provided. Add details, attach files, or link to external resources.
      </span>
      <br />
      <br />
      <a className="text-white-2 underline cursor-pointer" onClick={onEdit} data-test-id="write-milestone-description">
        Write Description
      </a>
    </div>
  );
}

function DescriptionFilled({ milestone, onEdit }) {
  return (
    <div className="border-y border-dark-5 my-4 py-2 min-h-[200px] relative">
      <RichContent jsonContent={milestone.description} />

      <div className="absolute top-2 right-0">
        <Button variant="secondary" size="tiny" onClick={onEdit} data-test-id="edit-milestone-description">
          Edit
        </Button>
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
    <div className="border border-dark-5 bg-dark-2 rounded my-4 px-4 p-4 pt-2 relative overflow-hidden">
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
