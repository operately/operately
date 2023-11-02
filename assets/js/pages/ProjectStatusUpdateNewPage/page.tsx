import React from "react";

import * as TipTapEditor from "@/components/Editor";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as People from "@/graphql/People";

import { useNavigate } from "react-router-dom";

import * as Projects from "@/graphql/Projects";

import Button from "@/components/Button";
import * as Forms from "@/components/Form";

import { useLoadedData } from "./loader";
import { AccordionWithOptions, AccordionWithStatus } from "./Accordion";
import { options } from "./healthOptions";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <Header />
        <Editor />
      </Paper.Body>
    </Paper.Root>
  );
}

function Header() {
  return (
    <div>
      <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN</div>
      <div className="text-4xl font-bold mx-auto">What's new since the last check-in?</div>
    </div>
  );
}

function Editor() {
  const { project } = useLoadedData();

  const navigate = useNavigate();

  const peopleSearch = People.usePeopleSearch();

  const { editor, submittable } = TipTapEditor.useEditor({
    placeholder: `Write your updates here...`,
    peopleSearch: peopleSearch,
    className: "min-h-[350px] py-2",
  });

  const [post] = Projects.usePostUpdate({
    onCompleted: (data) => navigate(`/projects/${project.id}/status_updates/${data.createUpdate.id}`),
  });

  const [health, setHealth] = React.useState({
    status: "on_track",
    schedule: "on_schedule",
    budget: "within_budget",
    team: "staffed",
    risks: "no_risks",
  });

  const submit = () => {
    if (!editor) return;
    if (!submittable) return;

    post({
      variables: {
        input: {
          updatableType: "project",
          updatableId: project.id,
          content: JSON.stringify(editor.getJSON()),
          health: health,
          messageType: "status_update",
        },
      },
    });
  };

  return (
    <TipTapEditor.Root>
      <TipTapEditor.Toolbar editor={editor} variant="large" />

      <div className="mb-8 text-white-1 text-lg relative border-b border-shade-2" style={{ minHeight: "350px" }}>
        <TipTapEditor.EditorContent editor={editor} />
        <TipTapEditor.LinkEditForm editor={editor} />
      </div>

      <Health health={health} setHealth={setHealth} />

      <div className="flex items-center gap-2">
        <Button onClick={submit} variant="success" data-test-id="post-status-update" disabled={!submittable}>
          <Icons.IconMail size={20} />
          {submittable ? "Submit" : "Uploading..."}
        </Button>
        <Button variant="secondary" linkTo={`/projects/${project.id}`}>
          Cancel
        </Button>
      </div>
    </TipTapEditor.Root>
  );
}

function Health({ health, setHealth }) {
  const { status, schedule, budget, team, risks } = health;

  const setStatus = (value: string) => setHealth({ ...health, status: value });
  const setSchedule = (value: string) => setHealth({ ...health, schedule: value });
  const setBudget = (value: string) => setHealth({ ...health, budget: value });
  const setTeam = (value: string) => setHealth({ ...health, team: value });
  const setRisks = (value: string) => setHealth({ ...health, risks: value });

  return (
    <div>
      <p className="font-bold text-lg">Is there a change in the project's health?</p>
      <p className="text-white-1/70">Please adjust the values below.</p>

      <div className="my-6 mb-10 flex flex-col gap-2">
        <AccordionWithOptions title="Status" value={status} options={options.status} onChange={setStatus} />
        <AccordionWithOptions title="Schedule" value={schedule} options={options.schedule} onChange={setSchedule} />
        <AccordionWithOptions title="Budget" value={budget} options={options.budget} onChange={setBudget} />
        <AccordionWithOptions title="Team" value={team} options={options.team} onChange={setTeam} />
        <AccordionWithOptions title="Risks" value={risks} options={options.risks} onChange={setRisks} />
      </div>
    </div>
  );
}
