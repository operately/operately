import React from "react";

import * as TipTapEditor from "@/components/Editor";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as People from "@/graphql/People";
import * as Pages from "@/components/Pages";

import { useNavigate } from "react-router-dom";

import * as Projects from "@/graphql/Projects";

import Button from "@/components/Button";

import { useLoadedData } from "./loader";
import { useHealthState, HealthState } from "./useHealthState";
import { AccordionWithOptions } from "./Accordion";
import { options } from "./healthOptions";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={["Check-In", project.name]}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo={`/projects/${project.id}`}>
            <Icons.IconClipboardList size={16} />
            {project.name}
          </Paper.NavItem>

          <Paper.NavSeparator />

          <Paper.NavItem linkTo={`/projects/${project.id}/status_updates`}>Check-Ins</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <Header />
          <Editor />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
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
  const { project } = useLoadedData();
  const { editor, healthState, submit } = useForm();

  return (
    <div className="mt-4">
      <TipTapEditor.Root>
        <TipTapEditor.Toolbar editor={editor.editor} />

        <div
          className="mb-8 text-content-accent text-lg relative border-b border-stroke-base"
          style={{ minHeight: "350px" }}
        >
          <TipTapEditor.EditorContent editor={editor.editor} />
        </div>

        <Health state={healthState} />

        <div className="flex items-center gap-2">
          <Button onClick={submit} variant="success" data-test-id="post-status-update" disabled={editor.uploading}>
            {editor.uploading ? "Uploading..." : "Submit"}
          </Button>
          <Button variant="secondary" linkTo={`/projects/${project.id}`}>
            Cancel
          </Button>
        </div>
      </TipTapEditor.Root>
    </div>
  );
}

function Health({ state }: { state: HealthState }) {
  return (
    <div>
      <p className="font-bold text-lg">Is there a change in the project's health?</p>
      <p className="text-content-dimmed">Please adjust the values below.</p>

      <div className="my-6 mb-10 flex flex-col gap-3">
        <AccordionWithOptions
          name="schedule"
          title="Schedule"
          value={state.schedule}
          options={options.schedule}
          onChange={state.setSchedule}
          commentsEditor={state.scheduleEditor}
        />
        <AccordionWithOptions
          name="budget"
          title="Budget"
          value={state.budget}
          options={options.budget}
          onChange={state.setBudget}
          commentsEditor={state.budgetEditor}
        />
        <AccordionWithOptions
          name="team"
          title="Team"
          value={state.team}
          options={options.team}
          onChange={state.setTeam}
          commentsEditor={state.teamEditor}
        />
        <AccordionWithOptions
          name="risks"
          title="Risks"
          value={state.risks}
          options={options.risks}
          onChange={state.setRisks}
          commentsEditor={state.risksEditor}
        />
        <AccordionWithOptions
          name="status"
          title="Status"
          value={state.status}
          options={options.status}
          onChange={state.setStatus}
          commentsEditor={state.statusEditor}
        />
      </div>
    </div>
  );
}

function useForm() {
  const { project } = useLoadedData();

  const navigate = useNavigate();
  const healthState = useHealthState(project);

  const editor = TipTapEditor.useEditor({
    placeholder: `Write your updates here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[350px] py-2 font-medium",
  });

  const [post] = Projects.usePostUpdate({
    onCompleted: (data: any) => navigate(`/projects/${project.id}/status_updates/${data.createUpdate.id}`),
  });

  const submit = () => {
    if (!editor.editor) return;
    if (editor.uploading) return;

    const health = {
      status: {
        value: healthState.status,
        comments: healthState.statusEditor.editor.getJSON(),
      },
      schedule: {
        value: healthState.schedule,
        comments: healthState.scheduleEditor.editor.getJSON(),
      },
      budget: {
        value: healthState.budget,
        comments: healthState.budgetEditor.editor.getJSON(),
      },
      team: {
        value: healthState.team,
        comments: healthState.teamEditor.editor.getJSON(),
      },
      risks: {
        value: healthState.risks,
        comments: healthState.risksEditor.editor.getJSON(),
      },
    };

    post({
      variables: {
        input: {
          updatableType: "project",
          updatableId: project.id,
          content: JSON.stringify(editor.editor.getJSON()),
          health: JSON.stringify(health),
          messageType: "status_update",
        },
      },
    });
  };

  return { editor, healthState, submit };
}
