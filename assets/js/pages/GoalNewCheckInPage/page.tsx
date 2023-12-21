import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as TipTapEditor from "@/components/Editor";

import { useLoadedData } from "./loader";
import { useForm } from "./useForm";

import Button from "@/components/Button";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={["Check-In", goal.name]}>
      <Paper.Root>
        <Navigation goal={goal} />

        <Paper.Body>
          <Header />
          <Editor />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation({ goal }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/goals/${goal.id}`}>{goal.name}</Paper.NavItem>

      <Paper.NavSeparator />

      <Paper.NavItem linkTo={`/goals/${goal.id}/check-ins`}>Check-Ins</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Header() {
  return (
    <div>
      <div className="uppercase text-content-accent tracking-wide w-full mb-1 text-sm font-semibold">CHECK-IN</div>
      <div className="text-4xl font-bold mx-auto">What's new since the last check-in?</div>
    </div>
  );
}

function Editor() {
  const { goal } = useLoadedData();
  const { editor, submit } = useForm();

  return (
    <div className="mt-4">
      <TipTapEditor.Root>
        <TipTapEditor.Toolbar editor={editor.editor} variant="large" />

        <div
          className="mb-8 text-content-accent text-lg relative border-b border-stroke-base"
          style={{ minHeight: "350px" }}
        >
          <TipTapEditor.EditorContent editor={editor.editor} />
          <TipTapEditor.LinkEditForm editor={editor.editor} />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={submit} variant="success" data-test-id="post-status-update" disabled={editor.uploading}>
            {editor.uploading ? "Uploading..." : "Submit"}
          </Button>
          <Button variant="secondary" linkTo={`/goals/${goal.id}`}>
            Cancel
          </Button>
        </div>
      </TipTapEditor.Root>
    </div>
  );
}
