import React from "react";

import { useParams } from "react-router-dom";
import { useProject } from "@/graphql/Projects";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Milestones from "@/graphql/Projects/milestones";

import Button from "@/components/Button";
import FormattedTime from "@/components/FormattedTime";
import DatePicker from "react-datepicker";

export function ProjectMilestonesPage() {
  const params = useParams();
  const projectId = params["project_id"];

  if (!projectId) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data, refetch } = useProject(projectId);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  const project = data.project;

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${projectId}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <Title projectId={projectId} refetch={refetch} />

        <MilestoneList project={project} refetch={refetch} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Title({ projectId, refetch }) {
  const [showAdd, setShowAdd] = React.useState(false);

  const onAddClick = () => setShowAdd(true);
  const close = async () => {
    await refetch();
    setShowAdd(false);
  };

  return (
    <div className="p-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-extrabold ">Milestones</div>
          <div className="text-medium">
            Set milestones for your project and track progress
          </div>
        </div>

        <div>
          <AddMilestoneButton onClick={onAddClick} />
        </div>
      </div>

      {showAdd && <AddMilestoneForm close={close} projectId={projectId} />}
    </div>
  );
}

function AddMilestoneForm({ projectId, close }) {
  const [value, setValue] = React.useState("");
  const [deadline, setDeadline] = React.useState(null);
  const disabled = value.length === 0 && !deadline;

  const [add, _s] = Milestones.useAddMilestone(projectId);

  const save = async () => {
    if (disabled) return;

    await add(value, deadline);
    close();
  };

  return (
    <div className="bg-shade-1 border-y border-shade-1 -mx-8 px-8 mt-4 py-8">
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
            <MilestoneDueDateEdit
              selected={deadline}
              setSelected={setDeadline}
            />
          </div>
        </div>
      </div>

      <div className="flex mt-8 gap-2">
        <Button variant="success" disabled={disabled} onClick={save}>
          <Icons.IconPlus size={20} />
          Add Milestone
        </Button>

        <Button variant="secondary" onClick={close}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function AddMilestoneButton({ onClick }) {
  return (
    <Button variant="success" onClick={onClick}>
      <Icons.IconPlus size={20} />
      Add Milestone
    </Button>
  );
}

function MilestoneList({ project, refetch }) {
  const milestones: Milestones.Milestone[] = Milestones.sortByDeadline(
    project.milestones
  );

  return (
    <div className="flex flex-col px-8 divide-y divide-shade-1 fadeIn">
      {milestones.map((m) => (
        <MilestoneItem key={m.id} milestone={m} refetch={refetch} />
      ))}
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
    <div className="flex items-center justify-between py-3 group">
      <div className="flex items-center gap-2">
        <MilestoneIcon milestone={milestone} onClick={toggleStatus} />
        <div>{milestone.title}</div>
      </div>

      <div className="flex items-center gap-2">
        <OverdueIndicator milestone={milestone} />
        <MilestoneDueDate milestone={milestone} />

        <div
          className="w-0 group-hover:w-6 group-hover:opacity-100 opacity-0 transition-all duration-200 cursor-pointer"
          onClick={onEdit}
        >
          <Icons.IconPencil size={20} className="text-white-3" />
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
    <div className="bg-shade-1 border-y border-shade-1 -mx-8 px-8 py-8">
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
            <MilestoneDueDateEdit
              selected={deadline}
              setSelected={setDeadline}
            />
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

  const days = Math.floor(
    (new Date().getTime() - new Date(milestone.deadlineAt).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (days <= 0) return null;

  return (
    <div className="flex items-center gap-1 text-red-400 text-sm">
      overdue {days} {days === 1 ? "day" : "days"}
    </div>
  );
}

function MilestoneIcon({ milestone, onClick }) {
  let icon: React.ReactNode = null;
  let hoverIcon: React.ReactNode = null;

  switch (milestone.status) {
    case "pending":
      icon = <Icons.IconCircle size={32} className="text-shade-3" />;
      hoverIcon = <Icons.IconCircleCheck size={32} className="text-shade-3" />;
      break;
    case "done":
      icon = <Icons.IconCircleCheck size={32} className="text-green-400" />;
      hoverIcon = icon;
      break;
    default:
      throw new Error("unknown milestone status " + milestone.status);
  }

  return (
    <div className="shrink-0 group cursor-pointer" onClick={onClick}>
      <div className="block group-hover:hidden">{icon}</div>
      <div className="hidden group-hover:block">{hoverIcon}</div>
    </div>
  );
}

function MilestoneDueDate({ milestone }) {
  if (isDueDateSet(milestone.deadlineAt)) {
    return <FormattedTime time={milestone.deadlineAt} format="short-date" />;
  } else {
    return <span className="text-shade-3">Not Set</span>;
  }
}

function MilestoneDueDate2({ milestone }) {
  const [open, setOpen] = React.useState(false);
  const [setDeadline, _s] = Milestones.useSetDeadline(milestone.id);

  const DateView = React.forwardRef((props, ref) => (
    <div onClick={props.onClick} ref={ref}>
      {isDueDateSet(props.value) ? (
        <FormattedTime time={props.value} format="short-date" />
      ) : (
        <span className="text-shade-3">Not Set</span>
      )}
    </div>
  ));

  let selected: Date | string = "";
  if (milestone.deadlineAt) {
    selected = new Date(Date.parse(milestone.deadlineAt));
  }

  const onChange = (date) => {
    setDeadline(date);
    setOpen(false);
  };

  return (
    <div className="cursor-pointer">
      <DatePicker
        selected={selected}
        onChange={onChange}
        customInput={<DateView />}
        open={open}
        onInputClick={() => setOpen(true)}
      >
        <div
          className="flex items-center gap-1 text-red-400"
          onClick={onChange}
        >
          <Icons.IconTrash size={16} />
          Clear due date
        </div>
      </DatePicker>
    </div>
  );
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
