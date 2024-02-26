import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as TipTapEditor from "@/components/Editor";

import { useLoadedData } from "./loader";
import { useForm } from "./useForm";
import { createTestId } from "@/utils/testid";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { FilledButton } from "@/components/Button";

export function Page() {
  const { project } = useLoadedData();
  const form = useForm(project);

  return (
    <Pages.Page title={"Closing " + project.name}>
      <Paper.Root size="small">
        <ProjectPageNavigation project={project} />
        <Paper.Body minHeight="none">
          <div className="uppercase text-content-accent text-sm">CLOSING THE PROJECT</div>
          <div className="text-content-accent text-3xl font-extrabold mb-8">Fill in the retrospective</div>

          <Question title="What went well?" editor={form.whatWentWell.editor} />
          <Question title="What could've gone better?" editor={form.whatCouldHaveGoneBetter.editor} />
          <Question title="What did you learn?" editor={form.whatDidYouLearn.editor} />

          <SubmitButton form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Question({ title, editor }) {
  const testId = createTestId(title);

  return (
    <div className="" data-test-id={testId}>
      <h2 className="text-content-accent text font-bold mb-1">{title}</h2>
      <div className="border-x border-stroke-base">
        <TipTapEditor.Root editor={editor}>
          <TipTapEditor.Toolbar editor={editor} />

          <div className="mb-8 text-content-accent relative border-b border-stroke-base px-2">
            <TipTapEditor.EditorContent editor={editor} />
          </div>
        </TipTapEditor.Root>
      </div>
    </div>
  );
}

function SubmitButton({ form }) {
  return (
    <div className="flex justify-center mt-8">
      <FilledButton size="lg" onClick={form.submit} testId="submit">
        Submit &amp; Close Project
      </FilledButton>
    </div>
  );
}
