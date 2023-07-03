import React from "react";

import classnames from "classnames";

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

  const milestoneGroups = Milestones.groupByPhase(project.milestones);

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${projectId}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <Title />

        <div className="flex flex-col gap-12 mb-8">
          {milestoneGroups.map((group) => (
            <PhaseMilestoneList project={project} refetch={refetch} phase={group.phase} milestones={group.milestones} />
          ))}
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function PhaseMilestoneList({ project, refetch, phase, milestones }) {
  const [showAdd, setShowAdd] = React.useState(false);
  const [open, setOpen] = React.useState(true);

  const close = async () => {
    await refetch();
    setShowAdd(false);
  };

  return (
    <div className="relative mt-4">
      <div className="relative">
        <div className="px-8 border-b border-shade-1 pb-2 flex items-center justify-between">
          <div className="flex items-center">
            {open && <Icons.IconRadiusTopLeft size={16} className="mt-2 mr-2 ml-2 text-shade-3" />}
            <div className="font-extrabold text-lg capitalize">{phase} Phase</div>
          </div>
          <div className="flex items-center gap-2">
            {project.phase === phase && (
              <div className="text-green-400 flex items-center gap-1 border border-green-400 text-xs font-bold py-1 px-2 rounded-lg ml-2">
                <Icons.IconCheck size={12} stroke={4} />
                Complete Phase
              </div>
            )}
            <div className="cursor-pointer" onClick={() => setOpen(!open)}>
              {open ? (
                <Icons.IconChevronDown size={20} className="text-white-2" />
              ) : (
                <Icons.IconChevronRight size={20} className="text-white-2" />
              )}
            </div>
          </div>
        </div>
        {open && (
          <React.Fragment>
            <div className="flex flex-col z-20 relative">
              {milestones.map((m) => (
                <MilestoneItem key={m.id} milestone={m} refetch={refetch} />
              ))}
            </div>
            {showAdd ? (
              <AddMilestoneForm close={close} projectId={project.id} phase={phase} />
            ) : (
              <div
                className="px-8 flex items-center py-4 border-b border-shade-1 cursor-pointer z-20 relative"
                onClick={() => setShowAdd(true)}
              >
                <div className="bg-dark-3 rounded-full">
                  <Icons.IconCirclePlus size={24} className="text-white-3 cursor-pointer" />
                </div>
                <div className="ml-2 text-white-2">Add Milestone</div>
              </div>
            )}
          </React.Fragment>
        )}
      </div>

      <div
        className="absolute border-l border-shade-3 z-10"
        style={{
          top: "23px",
          left: "43px",
          bottom: "16px",
        }}
      ></div>
    </div>
  );
}

function Title() {
  return (
    <div className="p-8 pb-8">
      <div className="flex items-center justify-center">
        <div>
          <div className="text-3xl font-extrabold text-center">Timeline</div>
          <div className="text-medium">Set milestones for your project and track progress</div>
        </div>
      </div>
    </div>
  );
}

function AddMilestoneForm({ projectId, close, phase }) {
  const [value, setValue] = React.useState("");
  const [deadline, setDeadline] = React.useState(null);
  const disabled = value.length === 0 && !deadline;

  const [add, _s] = Milestones.useAddMilestone(projectId);

  const save = async () => {
    if (disabled) return;

    await add(value, deadline, phase);
    close();
  };

  return (
    <div className="bg-dark-3 border-y border-shade-1 px-8 py-8 relative z-40">
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
