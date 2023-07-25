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
          <Content />
        </Context.Provider>
      </Paper.Body>
    </Paper.Root>
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
          <Button variant="success" onClick={onAddClick}>
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

  const showCompletedSeperator = pending.length > 0 && completed.length > 0;

  return (
    <div className="flex flex-col mb-8 gap-2">
      {pending.map((m) => (
        <Item key={m.id} milestone={m} />
      ))}

      {showCompletedSeperator && <h2 className="font-bold mt-12">Completed</h2>}

      {completed.map((m) => (
        <Item key={m.id} milestone={m} />
      ))}
    </div>
  );
}

function Item({ milestone }) {
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

  return (
    <div className="flex items-center bg-white-1/[3%] px-4 py-2 rounded-lg gap-2">
      {editable && (
        <div className="shrink-0 cursor-pointer" onClick={toggleComplete}>
          {milestone.status === "done" ? (
            <Icons.IconSquareCheck size={20} className="text-green-400" />
          ) : (
            <Icons.IconSquare size={20} className="text-white-1" />
          )}
        </div>
      )}

      <div className="shrink-0">
        <Icons.IconFlag3Filled size={16} className="text-yellow-400" />
      </div>

      <div className="flex-1 font-medium">{milestone.title}</div>

      <div className="shrink-0">
        <FormattedTime time={milestone.deadlineAt} format="long-date" />
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
        <Button variant="success" disabled={disabled} onClick={save} loading={loading}>
          <Icons.IconPlus size={20} />
          Add Milestone
        </Button>

        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function MilestoneItem({ milestone, refetch }) {
  const [state, setState] = React.useState<"view" | "edit">("view");

  const onEdit = () => setState("edit");
  const close = async () => {
    await refetch();
    setState("view");
  };

  if (state === "view") {
    return <MilestoneItemViewState milestone={milestone} onEdit={onEdit} />;
  }

  if (state === "edit") {
    return <MilestoneItemEditState milestone={milestone} close={close} />;
  }

  throw new Error("Invalid state " + state);
}

function MilestoneItemViewState({ milestone, onEdit }) {
  const [setStatus, _s] = Milestones.useSetStatus(milestone.id);

  const toggleStatus = () => {
    if (milestone.status === "pending") {
      setStatus("done");
    } else {
      setStatus("pending");
    }
  };

  return (
    <div className="flex items-center justify-between py-3 group px-8 border-b border-shade-1">
      <div className="flex items-center gap-2">
        <MilestoneIcon milestone={milestone} onClick={toggleStatus} />
        <div>{milestone.title}</div>
      </div>

      <div className="flex items-center gap-2">
        <OverdueIndicator milestone={milestone} />
        <MilestoneDueDate milestone={milestone} />

        <div
          className="shrink-0 cursor-pointer rounded-full bg-shade-1 p-1.5 ml-2 group/edit hover:bg-shade-2 transition-colors"
          onClick={onEdit}
        >
          <Icons.IconPencil size={14} className="text-white-2 group-hover/edit:text-pink-400" />
        </div>
      </div>
    </div>
  );
}

function MilestoneItemEditState({ milestone, close }) {
  const date = Milestones.parseDate(milestone.deadlineAt);

  const [value, setValue] = React.useState(milestone.title);
  const [deadline, setDeadline] = React.useState<Date | null>(date);
  const disabled = value.length === 0 && !deadline;

  const [update, _s1] = Milestones.useUpdateMilestone(milestone.id);
  const [remove, _s2] = Milestones.useRemoveMilestone(milestone.id);

  const onSave = async () => {
    if (disabled) return;

    await update(value, deadline);
    close();
  };

  const onRemove = async () => {
    await remove();
    close();
  };

  return (
    <div className="bg-dark-3 border-y border-shade-1 px-8 py-8">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="font-bold mb-1 block">Desribes the milestone</label>
          <div className="flex-1">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-shade-3 text-white-1 placeholder-white-2 border-none rounded-lg px-3"
              type="text"
              placeholder="ex. Contract signed with client"
            />
          </div>
        </div>

        <div className="shrink-0">
          <label className="font-bold mb-1 block">Due date</label>
          <div className="flex-1">
            <MilestoneDueDateEdit selected={deadline} setSelected={setDeadline} />
          </div>
        </div>
      </div>

      <div className="flex mt-8 justify-between">
        <div className="flex gap-2">
          <Button variant="success" disabled={disabled} onClick={onSave}>
            Save
          </Button>

          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="danger" onClick={onRemove}>
            <Icons.IconTrash size={20} />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

function OverdueIndicator({ milestone }) {
  if (milestone.status === "done") return null;
  if (!milestone.deadlineAt) return null;

  const days = Math.floor((new Date().getTime() - new Date(milestone.deadlineAt).getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 0) return null;

  return (
    <div className="flex items-center gap-1 text-red-400 text-sm font-medium">
      overdue {days} {days === 1 ? "day" : "days"}
    </div>
  );
}

function MilestoneIcon({ milestone, onClick }) {
  let icon: React.ReactNode = null;
  let hoverIcon: React.ReactNode = null;

  switch (milestone.status) {
    case "pending":
      icon = <Icons.IconCircle size={24} className="text-shade-3" />;
      hoverIcon = <Icons.IconCircleCheck size={24} className="text-shade-3" />;
      break;
    case "done":
      icon = <Icons.IconCircleCheck size={24} className="text-green-400" />;
      hoverIcon = icon;
      break;
    default:
      throw new Error("unknown milestone status " + milestone.status);
  }

  return (
    <div className="shrink-0 group cursor-pointer bg-dark-3" onClick={onClick}>
      <div className="block group-hover:hidden">{icon}</div>
      <div className="hidden group-hover:block">{hoverIcon}</div>
    </div>
  );
}

function MilestoneDueDate({ milestone }) {
  if (isDueDateSet(milestone.deadlineAt)) {
    return <FormattedTime time={milestone.deadlineAt} format="short-date" />;
  } else {
    return <span className="text-shade-3">No Due Date</span>;
  }
}

function isDueDateSet(value) {
  return value !== null && value !== undefined && value !== "";
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
