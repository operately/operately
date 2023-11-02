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

  const [health, setHealth] = React.useState<string>("on_track");

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

      <FieldUpdates health={health} setHealth={setHealth} />

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

function FieldUpdates({ health, setHealth }) {
  const [schedule, setSchedule] = React.useState<string>("yes");
  const [budget, setBudget] = React.useState<string>("yes");
  const [team, setTeam] = React.useState<string>("yes");

  return (
    <div>
      <p className="font-bold text-lg">Is there a change in the project's health?</p>
      <p className="text-white-1/70">Please adjust the values below.</p>

      <div className="my-6 mb-10 flex flex-col gap-2">
        <Accoridion
          title="Status"
          status={
            <span className="font-medium flex items-center gap-2">
              On Track
              <Icons.IconCircleFilled size={12} className="text-green-400" />
            </span>
          }
        >
          <Forms.RadioGroup name="status" defaultValue="everyone" onChange={(e) => console.log(e)}>
            <div className="border-t border-dark-5 p-2 py-3 px-3 pb-2">
              <Forms.RadioWithExplanation
                label={
                  <span className="font-medium flex items-center gap-2">
                    On Track
                    <Icons.IconCircleFilled size={12} className="text-green-400" />
                  </span>
                }
                explanation={"Progressing well, we are delivering results"}
                value="on_track"
              />
            </div>

            <div className="border-t border-dark-5 p-2 py-3 px-3 pb-2">
              <Forms.RadioWithExplanation
                label={
                  <span className="font-medium flex items-center gap-2">
                    At Risk
                    <Icons.IconCircleFilled size={12} className="text-yellow-400" />
                  </span>
                }
                explanation={"Small concerns, but we are confident that we will deliver"}
                value="at_risk"
              />
            </div>

            <div className="border-t border-dark-5 p-2 py-3 px-3 pb-2">
              <Forms.RadioWithExplanation
                label={
                  <span className="font-medium flex items-center gap-2">
                    Off Track
                    <Icons.IconCircleFilled size={12} className="text-red-400" />
                  </span>
                }
                explanation={"Major problems, not confident that we will deliver"}
                value="off_track"
              />
            </div>

            <div className="border-t border-dark-5 p-2 py-3 px-3 pb-2">
              <Forms.RadioWithExplanation
                label={
                  <span className="font-medium flex items-center gap-2">
                    Paused
                    <Icons.IconCircleFilled size={12} className="text-gray-400" />
                  </span>
                }
                explanation={"Temporarely paused. We will resume soon."}
                value="paused"
              />
            </div>
          </Forms.RadioGroup>
        </Accoridion>

        <Accoridion
          title="Schedule"
          status={
            <span className="font-medium flex items-center gap-2">
              On Schedule
              <Icons.IconCircleFilled size={12} className="text-green-400" />
            </span>
          }
        >
          <Forms.RadioGroup name="status" defaultValue="everyone" onChange={(e) => console.log(e)}>
            <div className="border-t border-dark-5 p-2 py-3 px-3 pb-2">
              <Forms.RadioWithExplanation
                label={
                  <span className="font-medium flex items-center gap-2">
                    On Schedule
                    <Icons.IconCircleFilled size={12} className="text-green-400" />
                  </span>
                }
                explanation={"We have a timeline, and we are hitting the deadlines"}
                value="on_track"
              />
            </div>

            <div className="border-t border-dark-5 p-2 py-3 px-3 pb-2">
              <Forms.RadioWithExplanation
                label={
                  <span className="font-medium flex items-center gap-2">
                    Small Delays
                    <Icons.IconCircleFilled size={12} className="text-yellow-400" />
                  </span>
                }
                explanation={"We are experiecing small delays in the schedule"}
                value="at_risk"
              />
            </div>

            <div className="border-t border-dark-5 p-2 py-3 px-3 pb-2">
              <Forms.RadioWithExplanation
                label={
                  <span className="font-medium flex items-center gap-2">
                    Major Delays
                    <Icons.IconCircleFilled size={12} className="text-red-400" />
                  </span>
                }
                explanation={"We are experiecing small delays in the schedule"}
                value="at_risk"
              />
            </div>
          </Forms.RadioGroup>

          <div className="border-t border-dark-5 p-2 py-3 px-3 pb-2">
            <span className="text-white-2">Add further details...</span>
          </div>
        </Accoridion>
        <Accoridion title="Budget" status={<span className="text-green-400 font-medium text-sm">Within Budget</span>}>
          Hello
        </Accoridion>
        <Accoridion
          title="Team"
          status={<span className="text-green-400 font-medium text-sm">Staffed with suitable roles</span>}
        >
          Hello
        </Accoridion>
        <Accoridion title="Risks" status={<span className="text-green-400 font-medium text-sm">No known risks</span>}>
          Hello
        </Accoridion>
      </div>
    </div>
  );
}
// <BudgetDropdown budget={budget} setBudget={setBudget} />
// <TeamDropdown team={team} setTeam={setTeam} />

function Accoridion({ title, status, children }) {
  const [open, setOpen] = React.useState<boolean>(true);
  const toggle = () => setOpen(!open);

  return (
    <div className="border border-dark-5 rounded">
      <div className="flex items-center justify-between cursor-pointer py-3 px-2.5" onClick={toggle}>
        <div className="flex items-center gap-2">
          <div className="text-white-1 font-bold">{title}</div>
          {!open && (
            <>
              <Icons.IconArrowRight size={16} className="text-white-2" />
              {status}
            </>
          )}
        </div>

        <div>{open ? <Icons.IconChevronUp size={20} /> : <Icons.IconChevronDown size={20} />}</div>
      </div>

      {open && <div className="">{children}</div>}
    </div>
  );
}

function StatusDropdown({ health, setHealth }) {
  const options = [
    { value: "on_track", label: <StatusOptionLabel color="text-green-400" title="On Track" /> },
    { value: "at_risk", label: <StatusOptionLabel color="text-yellow-400" title="At Risk" /> },
    { value: "off_track", label: <StatusOptionLabel color="text-red-400" title="Off Track" /> },
  ];

  const value = options.find((option) => option.value === health) || options[0];
  const onChange = (e: { value: string }) => setHealth(e.value);

  return <Forms.SelectBox label="Status" value={value} onChange={onChange} options={options} />;
}

function StatusOptionLabel({ color, title }) {
  return (
    <span className="flex items-center gap-2">
      <Icons.IconCircleFilled size={16} className={color} /> {title}
    </span>
  );
}

function Schedule({ schedule, setSchedule }) {
  const [editing, setEditing] = React.useState<boolean>(false);

  if (!editing) {
    return (
      <div className="bg-dark-2 rounded-lg p-4 font-medium border border-dark-5 py-2 w-96">
        <div className="flex items-center justify-between">
          <div className="font-extrabold">Schedule</div>
          <div className="flex items-center gap-2">
            <div className="underline decoration-white-2 text-white-2">edit</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          Is the project on schedule? <Icons.IconArrowRight size={16} className="text-white-1" />{" "}
          <span className="text-red-400 font-bold">No</span>
        </div>
        <div className="border-t border-dark-5 mt-2 pt-2">
          Unfortunately, no. We didn't plan that the other team will be on a leave.
        </div>
      </div>
    );
  } else {
    return <ScheduleDropdown schedule={schedule} setSchedule={setSchedule} />;
  }
}

function Budget({ schedule, setSchedule }) {
  const [editing, setEditing] = React.useState<boolean>(false);

  if (!editing) {
    return (
      <div className="flex items-center gap-2 font-medium border-y border-dark-5 py-2">
        Is the project within budget? <Icons.IconArrowRight size={16} className="text-white-1" />{" "}
        <span className="text-green-400 font-bold">Yes</span>
        <div className="ml-10" />
        <Button size="tiny" variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
    );
  } else {
    return <ScheduleDropdown schedule={schedule} setSchedule={setSchedule} />;
  }
}

function ScheduleDropdown({ schedule, setSchedule }) {
  const options = [
    { value: "yes", label: <ScheduleOptionLabel color="text-green-400" title="Yes" /> },
    { value: "no", label: <ScheduleOptionLabel color="text-red-400" title="No" /> },
  ];

  const value = options.find((option) => option.value === schedule) || options[0];
  const onChange = (e: { value: string }) => setSchedule(e.value);

  return <Forms.SelectBox label="Is the project on schedule?" value={value} onChange={onChange} options={options} />;
}

function ScheduleOptionLabel({ color, title }) {
  return (
    <span className="flex items-center gap-2">
      <Icons.IconCircleFilled size={16} className={color} />
      {title}
    </span>
  );
}

function BudgetDropdown({ budget, setBudget }) {
  const options = [
    { value: "yes", label: <BudgetOptionLabel color="text-green-400" title="Yes" /> },
    { value: "no", label: <BudgetOptionLabel color="text-red-400" title="No" /> },
  ];

  const value = options.find((option) => option.value === budget) || options[0];
  const onChange = (e: { value: string }) => setBudget(e.value);

  return <Forms.SelectBox label="Is the project within budget?" value={value} onChange={onChange} options={options} />;
}

function BudgetOptionLabel({ color, title }) {
  return (
    <span className="flex items-center gap-2">
      <Icons.IconCircleFilled size={16} className={color} />
      {title}
    </span>
  );
}

function TeamDropdown({ team, setTeam }) {
  const options = [
    { value: "yes", label: <TeamOptionLabel color="text-green-400" title="Yes" /> },
    { value: "no", label: <TeamOptionLabel color="text-red-400" title="No" /> },
  ];

  const value = options.find((option) => option.value === team) || options[0];
  const onChange = (e: { value: string }) => setTeam(e.value);

  return (
    <Forms.SelectBox
      label="Is the team staffed with suitable roles?"
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}

function TeamOptionLabel({ color, title }) {
  return (
    <span className="flex items-center gap-2">
      <Icons.IconCircleFilled size={16} className={color} />
      {title}
    </span>
  );
}
