import React from "react";
import * as Icons from "@tabler/icons-react";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as People from "@/models/people";
import * as Paper from "@/components/PaperContainer";
import * as TipTapEditor from "@/components/Editor";

import Button from "@/components/Button";
import { Spacer } from "@/components/Spacer";

import { useDocumentTitle } from "@/layouts/header";
import { useNavigate } from "react-router-dom";

interface LoaderResult {
  project: Projects.Project;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
    me: await People.getMe(),
  };
}

export function Page() {
  const navigate = useNavigate();
  const [{ project }] = Paper.useLoadedData() as [LoaderResult];

  useDocumentTitle(["New Discussion", project.name]);

  const [title, setTitle] = React.useState("");

  const peopleSearch = People.usePeopleSearch();

  const { editor, uploading, empty } = TipTapEditor.useEditor({
    placeholder: "Write here...",
    peopleSearch: peopleSearch,
    className: "min-h-[350px] py-2 px-1",
  });

  const [post, { loading }] = Projects.usePostUpdate({
    onCompleted: (data: any) => navigate(`/projects/${project.id}/discussions/${data.createUpdate.id}`),
  });

  const submit = async () => {
    if (!editor) return;
    if (uploading) return;

    await post({
      variables: {
        input: {
          updatableType: "project",
          updatableId: project.id,
          content: JSON.stringify({
            title: title,
            body: editor.getJSON(),
          }),
          messageType: "project_discussion",
        },
      },
    });
  };

  const submitDisabled = uploading || !title || empty;

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <input
          type="text"
          className="text-3xl font-extrabold w-full bg-transparent border-none focus:outline-none p-0 text-white-1 placeholder-white-2 focus:ring-0"
          placeholder="Type a title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-test-id="discussion-title-input"
        />

        <Message editor={editor} />
        <Spacer size={4} />

        <Button
          variant="success"
          disabled={submitDisabled}
          loading={loading}
          data-test-id="submit-discussion-button"
          onClick={submit}
        >
          {uploading ? "Uploading..." : "Post this message"}
        </Button>
      </Paper.Body>
    </Paper.Root>
  );
}

function Message({ editor }) {
  return (
    <div className="text-lg">
      <TipTapEditor.Root>
        <TipTapEditor.Toolbar editor={editor} variant="large" />

        <div className="mb-8 text-white-1 relative border-b border-shade-2" style={{ minHeight: "350px" }}>
          <TipTapEditor.EditorContent editor={editor} />
          <TipTapEditor.LinkEditForm editor={editor} />
        </div>
      </TipTapEditor.Root>
    </div>
  );
}
