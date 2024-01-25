import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/graphql/Projects";

import { useLoadedData } from "./loader";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { GhostButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Overview Edit", project.name]}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={`/projects/${project.id}`}>
            <Icons.IconClipboardList size={16} />
            {project.name}
          </Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <div className="text-content-accent text-sm font-medium">PROJECT OVERVIEW</div>
          <div className="text-content-accent text-4xl font-bold">Why are we executing this project?</div>

          <Editor />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Editor() {
  const { project } = useLoadedData();

  const goToProjectPage = useNavigateTo(`/projects/${project.id}`);

  const [post] = Projects.useUpdateDescriptionMutation({
    onCompleted: goToProjectPage,
  });

  const editor = TipTapEditor.useEditor({
    placeholder: `Write your updates here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[350px] py-2 font-medium",
    content: JSON.parse(project.description!),
  });

  const submit = React.useCallback(async () => {
    if (!editor.editor) return;

    await post({
      variables: {
        projectId: project.id,
        description: JSON.stringify(editor.editor.getJSON()),
      },
    });
  }, [editor.editor, post, project.id]);

  return (
    <div className="mt-4">
      <TipTapEditor.Root editor={editor.editor}>
        <TipTapEditor.Toolbar editor={editor.editor} />

        <div className="mb-8 text-content-accent relative border-b border-stroke-base" style={{ minHeight: "350px" }}>
          <TipTapEditor.EditorContent editor={editor.editor} />
        </div>

        <div className="flex items-center gap-4">
          <GhostButton onClick={submit} testId="save">
            Save Project Overview
          </GhostButton>
          <DimmedLink to={`/projects/${project.id}`}>Discard Changes</DimmedLink>
        </div>
      </TipTapEditor.Root>
    </div>
  );
}
