import React from "react";

import client from "@/graphql/client";
import { useDocumentTitle } from "@/layouts/header";
import { useNavigate } from "react-router-dom";

import * as Projects from "@/graphql/Projects";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as TipTapEditor from "@/components/Editor";

import Button from "@/components/Button";

export async function loader({ params }) {
  let res = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.project_id },
    fetchPolicy: "network-only",
  });

  return {
    project: res.data.project,
  };
}

export function Page() {
  const [data] = Paper.useLoadedData() as [{ project: Projects.Project }];
  const project = data.project as Projects.Project;

  useDocumentTitle(project.name);

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <h1 className="text-3xl font-extrabold">{project.name}</h1>
        <Editor project={project} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Editor({ project }) {
  const navigate = useNavigate();

  const [post, { loading }] = Projects.useUpdateDescriptionMutation({
    onCompleted: () => {
      navigate(`/projects/${project.id}`);
    },
  });

  const submit = () => {
    if (!editor) return;

    const content = editor.getJSON();

    post({
      variables: { projectId: project.id, description: JSON.stringify(content) },
    });
  };

  const editor = TipTapEditor.useEditor({
    placeholder: "Write the description here...",
    content: JSON.parse(project.description),
  });

  return (
    <div>
      <TipTapEditor.Toolbar editor={editor} variant="large" />

      <div className="mb-8 py-4 text-white-1 text-lg" style={{ minHeight: "300px" }}>
        <TipTapEditor.EditorContent editor={editor} />
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={submit} variant="success" loading={loading}>
          Save
        </Button>
        <Button variant="secondary" linkTo={`/projects/${project.id}`}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
