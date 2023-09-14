import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";
import * as Milestones from "@/graphql/Projects/milestones";

import Button from "@/components/Button";
import FormattedTime from "@/components/FormattedTime";
import DatePicker from "react-datepicker";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as Me from "@/graphql/Me";

import * as Time from "@/utils/time";

interface LoaderResult {
  project: Projects.Project;
  me: any;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.project_id },
    fetchPolicy: "network-only",
  });

  let meData = await client.query({
    query: Me.GET_ME,
  });

  return {
    project: projectData.data.project,
    me: meData.data.me,
  };
}

interface ContextValue {
  project: Projects.Project;
  refetch: () => void;
  editable: boolean;
}

const Context = React.createContext<ContextValue | null>(null);

export function Page() {
  const [{ project, me }, refetch] = Paper.useLoadedData() as [LoaderResult, () => void];

  useDocumentTitle(project.name);

  const [formVisible, setFormVisible] = React.useState(false);
  const showForm = () => setFormVisible(true);
  const hideForm = () => setFormVisible(false);
  const refetchAndHideForm = () => {
    hideForm();
    refetch();
  };

  const editable = project.champion?.id === me.id;

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <Context.Provider value={{ project, refetch, editable }}>
          <Title onAddClick={showForm} />
          <AddMilestoneForm visible={formVisible} onCancel={hideForm} onSubmit={refetchAndHideForm} />
          <ProjectPhases />
          <Timeline />
          <Content />
        </Context.Provider>
      </Paper.Body>
    </Paper.Root>
  );
}

function Timeline() {
  const { project } = React.useContext(Context) as ContextValue;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-2xl font-extrabold ">Timeline</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {project.milestones.map((milestone) => (
          <div key={milestone.id} className="border border-dark-8 p-4 rounded">
            <div className="mb-4">
              <div className="text-white-1 font-bold capitalize">{milestone.title}</div>
            </div>

            <div className="text-white-1 flex items-center justify-between text-sm">
              <div className="font-bold w-20">Due Date</div>
              <FormattedTime time={milestone.deadlineAt} format="long-date" />
            </div>

            <div className="text-white-1 flex items-center justify-between text-sm">
              <div className="font-bold w-20">Completed</div>
              <FormattedTime time={milestone.completedAt} format="long-date" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectPhases() {
  const { project } = React.useContext(Context) as ContextValue;

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        {project.phaseHistory.map((phase) => (
          <div key={phase.id} className="border border-dark-8 p-4 rounded">
            <div className="mb-4">
              <div className="text-white-1 font-bold capitalize">{phase.phase}</div>
            </div>

            <div className="text-white-1 flex items-center justify-between text-sm">
              <div className="font-bold w-20">Started</div>
              <FormattedTime time={phase.dueTime} format="long-date" />
            </div>

            <div className="text-white-1 flex items-center justify-between text-sm">
              <div className="font-bold w-20">Due Date</div>
              {phase.dueTime ? <FormattedTime time={phase.dueTime} format="long-date" /> : "Not Set"}
            </div>

            <div className="text-white-1 flex items-center justify-between text-sm">
              <div className="font-bold w-20">Completed</div>
              <FormattedTime time={phase.endTime} format="long-date" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Title({ onAddClick }) {
  const { editable } = React.useContext(Context) as ContextValue;

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <div className="text-2xl font-extrabold ">Milestones</div>
      </div>

      <div>
        {editable && (
          <Button variant="success" onClick={onAddClick} data-test-id="add-milestone">
            <Icons.IconPlus size={20} />
            Add
          </Button>
        )}
      </div>
    </div>
  );
}

function Content() {
  const { project } = React.useContext(Context) as ContextValue;

  if (project.milestones.length === 0) {
    return <EmptyState />;
  } else {
    return <MilestoneList />;
  }
}

function EmptyState() {
  return null;
}

function MilestoneList() {
  const { project } = React.useContext(Context) as ContextValue;
  const milestones = Milestones.sortByDeadline(project.milestones);

  const [pending, completed] = [
    milestones.filter((m) => m.status === "pending"),
    milestones.filter((m) => m.status === "done"),
  ];

  const [showCompleted, setShowCompleted] = React.useState(false);

  return (
    <div className="flex flex-col mb-8 gap-2">
      {pending.length > 0 && <h2 className="font-bold mt-12">Milestones</h2>}

      <div>
        {pending.map((m) => (
          <Item key={m.id} milestone={m} />
        ))}
      </div>

      {showCompleted ? (
        <div>
          <h2 className="font-bold mt-12 mb-2 flex items-center gap-1.5">
            Completed Milestones &middot;
            <span
              className="text-white-2 text-sm underline underline-offset-2 cursor-pointer"
              onClick={() => setShowCompleted(false)}
            >
              Hide
            </span>
          </h2>
          <div>
            {completed.map((m) => (
              <Item key={m.id} milestone={m} />
            ))}
          </div>
        </div>
      ) : (
        completed.length > 0 && (
          <div className="flex">
            <span
              className="text-white-2 text-sm underline underline-offset-2 cursor-pointer"
              onClick={() => setShowCompleted(true)}
            >
              {completed.length} completed
            </span>
          </div>
        )
      )}
    </div>
  );
}

function Item({ milestone }) {
  const { refetch } = React.useContext(Context) as ContextValue;

  const [state, setState] = React.useState<"view" | "edit">("view");

  const onEditClick = () => setState("edit");
  const onCancel = () => setState("view");
  const onSubmit = () => {
    refetch();
    setState("view");
  };

  if (state === "edit") {
    return <ItemEdit milestone={milestone} onCancel={onCancel} onSubmit={onSubmit} />;
  } else {
    return <ItemShow milestone={milestone} onEditClick={onEditClick} />;
  }
}

function ItemEdit({ milestone, onCancel, onSubmit }) {
  const [value, setValue] = React.useState(milestone.title);
  const [deadline, setDeadline] = React.useState(Time.parse(milestone.deadlineAt));
  const disabled = value.length === 0 || !deadline;

  const [update, { loading }] = Milestones.useUpdateMilestone({ onCompleted: onSubmit });
  const [remove] = Milestones.useRemoveMilestone({ onCompleted: onSubmit });

  const save = async () => {
    if (disabled) return;
    if (loading) return;
    if (!deadline) return;

    await update({
      variables: {
        milestoneId: milestone.id,
        title: value,
        deadlineAt: Time.toDateWithoutTime(deadline),
      },
    });
  };

  const trash = async () => {
    await remove({ variables: { milestoneId: milestone.id } });
  };

  return (
    <div className="bg-white-1/[5%] p-8 rounded-lg mb-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Forms.TextInput
            label="Describe the milestone"
            placeholder="ex. Contract Signed"
            value={value}
            onChange={setValue}
          />
        </div>

        <div className="shrink-0">
          <label className="font-bold mb-1 block">Due date</label>
          <div className="flex-1">
            <MilestoneDueDateEdit selected={deadline} setSelected={setDeadline} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="success" disabled={disabled} onClick={save} loading={loading}>
            Save
          </Button>

          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="border border-shade-3 rounded-full p-2 cursor-pointer hover:bg-red-400/10 hover:text-red-400">
            <Icons.IconTrash size={16} onClick={trash} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemShow({ milestone, onEditClick }) {
  const { editable, refetch } = React.useContext(Context) as ContextValue;

  const [setStatus] = Milestones.useSetStatus({ onCompleted: refetch });

  const toggleComplete = async () => {
    await setStatus({
      variables: {
        milestoneId: milestone.id,
        status: milestone.status === "pending" ? "done" : "pending",
      },
    });
  };

  const labelWidth = milestone.status === "done" ? "w-28" : "w-18";

  return (
    <div className="flex justify-between items-center first:border-t border-b border-dark-5 py-3">
      <div className="flex items-start gap-3">
        <div>
          <div className="flex-1 font-bold text-sky-400 underline mb-1">{milestone.title}</div>

          <div className="shrink-0 text-sm flex items-center gap-2">
            <div className={"text-white-1" + " " + labelWidth}>Due Date</div>{" "}
            <span className="font-bold">
              <FormattedTime time={milestone.deadlineAt} format="long-date" />
            </span>
          </div>

          {milestone.status === "done" && (
            <div className="shrink-0 text-sm flex items-center gap-2">
              <div className={"text-white-1" + " " + labelWidth}>Completed On</div>{" "}
              <span className="font-bold">
                <FormattedTime time={milestone.completedAt} format="long-date" />
              </span>
            </div>
          )}
        </div>
      </div>

      <div>
        {editable && milestone.status === "pending" && (
          <Button variant="secondary" size="small" onClick={toggleComplete}>
            Mark as Complete
          </Button>
        )}
        {milestone.status === "done" && (
          <div className="h-full p-2">
            <Icons.IconCheck size={32} stroke={5} strokeLinecap="square" className="text-green-400" />
          </div>
        )}
      </div>
    </div>
  );
}

function AddMilestoneForm({ visible, onSubmit, onCancel }) {
  const { project } = React.useContext(Context) as ContextValue;

  const [value, setValue] = React.useState("");
  const [deadline, setDeadline] = React.useState(null);
  const disabled = value.length === 0 || !deadline;
  const [add, { loading }] = Milestones.useAddMilestone({ onCompleted: onSubmit });

  if (!visible) return <></>;

  const save = async () => {
    if (disabled) return;
    if (loading) return;
    if (!deadline) return;

    setValue("");
    setDeadline(null);

    await add({
      variables: {
        projectId: project.id,
        title: value,
        deadlineAt: Time.toDateWithoutTime(deadline),
      },
    });
  };

  return (
    <div className="bg-white-1/[5%] p-8 rounded-lg mb-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Forms.TextInput
            label="Describe the milestone"
            placeholder="ex. Contract Signed"
            value={value}
            onChange={setValue}
            data-test-id="milestone-title"
          />
        </div>

        <div className="shrink-0">
          <label className="font-bold mb-1 block">Due date</label>
          <div className="flex-1">
            <MilestoneDueDateEdit selected={deadline} setSelected={setDeadline} />
          </div>
        </div>
      </div>

      <div className="flex mt-8 gap-2">
        <Button variant="success" disabled={disabled} onClick={save} loading={loading} data-test-id="save">
          <Icons.IconPlus size={20} />
          Add
        </Button>

        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function MilestoneDueDateEdit({ selected, setSelected }) {
  return (
    <div className="cursor-pointer">
      <DatePicker
        selected={selected}
        onChange={(date) => setSelected(date)}
        placeholderText="Select date..."
        dateFormat="MMMM d, yyyy"
      />
    </div>
  );
}
