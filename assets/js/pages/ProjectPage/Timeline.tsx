import React from "react";

import { useNavigate } from "react-router-dom";
import { useBoolState } from "@/utils/useBoolState";

import FormattedTime from "@/components/FormattedTime";
import DatePicker from "react-datepicker";
import { MilestoneLink } from "@/routes/Links";

import * as SelectBox from "@/components/SilentSelectBox";
import * as Projects from "@/graphql/Projects";
import * as Time from "@/utils/time";
import * as Icons from "@tabler/icons-react";
import * as Milestones from "@/graphql/Projects/milestones";

import Button, { IconButton } from "@/components/Button";
import ProjectPhaseSelector from "@/components/ProjectPhaseSelector";
import { ProjectLifecycleGraph } from "@/components/ProjectLifecycleGraph";

import Modal from "@/components/Modal";
import * as Forms from "@/components/Form";

interface ContextDescriptor {
  project: Projects.Project;
  refetch: () => void;
  editable: boolean;
}

const Context = React.createContext<ContextDescriptor | null>(null);

export default function Timeline({ project, refetch, editable }) {
  return (
    <Context.Provider value={{ project, refetch, editable }}>
      <div className="my-8" data-test-id="timeline">
        <div className="flex items-start justify-between">
          <div className="font-extrabold text-lg text-white-1 leading-none">Timeline</div>
          <div>
            <EditTimeline project={project} refetch={refetch} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Dates />
              <Phase />
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow-lg bg-dark-3 my-4">
          <ProjectLifecycleGraph project={project} />
        </div>

        <div className="rounded-lg shadow-lg bg-dark-3 my-4">
          <MilestoneList project={project} refetch={refetch} />
        </div>
      </div>
    </Context.Provider>
  );
}

function EditTimeline({ project, refetch }: { project: Projects.Project; refetch: () => void }) {
  const [isOpen, _, open, close] = useBoolState(false);

  const planning = project.phaseHistory.find((phase) => phase.phase === "planning");
  const execution = project.phaseHistory.find((phase) => phase.phase === "execution");
  const control = project.phaseHistory.find((phase) => phase.phase === "control");

  const [planningDueDate, setPlanningDueDate] = React.useState<Date | null>(Time.parse(planning?.dueTime));
  const [executionDueDate, setExecutionDueDate] = React.useState<Date | null>(Time.parse(execution?.dueTime));
  const [controlDueDate, setControlDueDate] = React.useState<Date | null>(Time.parse(control?.dueTime));

  const [edit, { loading }] = Projects.useEditProjectTimeline({
    onCompleted: () => {
      close();
      refetch();
    },
  });

  const submit = async () => {
    await edit({
      variables: {
        input: {
          projectId: project.id,
          planningDueTime: planningDueDate && Time.toDateWithoutTime(planningDueDate),
          executionDueTime: executionDueDate && Time.toDateWithoutTime(executionDueDate),
          controlDueTime: controlDueDate && Time.toDateWithoutTime(controlDueDate),
        },
      },
    });
  };

  return (
    <>
      <Button variant="secondary" data-test-id="edit-project-timeline" onClick={open}>
        Edit Timeline
      </Button>

      <Modal title={"Edit Timeline"} isOpen={isOpen} hideModal={close} minHeight="200px">
        <Forms.Form onSubmit={submit} onCancel={close} isValid={true} loading={loading}>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 border-b border-dark-5 font-bold pb-2">
              <div className="w-32 forn-medium">Phase</div>
              <div className="flex-1">Due Date</div>
            </div>

            <div className="flex items-center gap-2 border-b border-dark-5 pb-2">
              <div className="w-32 forn-medium">Planning</div>

              <Forms.Datepicker selected={planningDueDate} onChange={setPlanningDueDate} placeholder="Select Date" />
            </div>

            <div className="flex items-center gap-2 border-b border-dark-5 pb-2">
              <div className="w-32 forn-medium">Execution</div>

              <Forms.Datepicker selected={executionDueDate} onChange={setExecutionDueDate} placeholder="Select Date" />
            </div>

            <div className="flex items-center gap-2 border-b border-dark-5 pb-2">
              <div className="w-32 forn-medium">Control</div>

              <Forms.Datepicker selected={controlDueDate} onChange={setControlDueDate} placeholder="Select Date" />
            </div>
          </div>

          <Forms.SubmitArea>
            <Forms.SubmitButton>Save</Forms.SubmitButton>
            <Forms.CancelButton>Cancel</Forms.CancelButton>
          </Forms.SubmitArea>
        </Forms.Form>
      </Modal>
    </>
  );
}

function MilestoneList({ project, refetch }) {
  const [expanded, _, expand, collapse] = useBoolState(false);

  return (
    <div className="py-3">
      {expanded ? (
        <MilestoneListExpanded project={project} refetch={refetch} onCollapse={collapse} />
      ) : (
        <MilestoneListCollapsed project={project} refetch={refetch} onExpand={expand} />
      )}
    </div>
  );
}

function MilestoneListCollapsed({ project, refetch, onExpand }) {
  return (
    <div className="flex items-end justify-between px-4">
      <NextMilestone project={project} refetch={refetch} />
      <div
        className="flex items-center gap-1 cursor-pointer font-medium text-white-1/60 hover:text-white-1"
        onClick={onExpand}
        data-test-id="show-all-milestones"
      >
        <Icons.IconArrowDown size={16} stroke={2} />
        Show all milestones
      </div>
    </div>
  );
}

function MilestoneListExpanded({ project, onCollapse, refetch }) {
  const milestones = Milestones.sortByDeadline(project.milestones, { reverse: false });

  return (
    <div className="">
      <div className="flex items-center border-b border-dark-5 pb-2 px-4">
        <div className="font-semibold flex-1">Milestone</div>
        <div className="font-semibold w-32 pl-1">Due On</div>
        <div className="font-semibold w-32">Completed</div>
        <div className="font-semibold w-16"></div>
      </div>

      {milestones.map((milestone: Milestones.Milestone) => (
        <MilestoneListItem key={milestone.id} milestone={milestone} project={project} refetch={refetch} />
      ))}

      <MilestoneAdd project={project} refetch={refetch} />

      <div className="flex items-center justify-between -mb-3">
        <div></div>

        <div
          className="flex items-center gap-1 cursor-pointer font-medium text-white-1/60 hover:text-white-1 px-4 py-3"
          onClick={onCollapse}
        >
          <Icons.IconArrowUp size={16} stroke={2} />
          Collapse
        </div>
      </div>
    </div>
  );
}

function MilestoneAdd({ project, refetch }) {
  const [active, _, activate, deactivate] = useBoolState(false);

  if (!project.permissions.canCreateMilestone) return null;

  if (active) {
    return <MilestoneAddActive project={project} refetch={refetch} deactivate={deactivate} />;
  } else {
    return <MilestoneAddNotActive activate={activate} />;
  }
}

function MilestoneAddNotActive({ activate }) {
  return (
    <div
      className="flex items-center border-b border-dark-5 py-3 group hover:bg-shade-1 px-4 cursor-pointer"
      onClick={activate}
      data-test-id="add-milestone"
    >
      <div className="flex items-center gap-2 flex-1 truncate">
        <Icons.IconPlus size={16} className={"text-white-1/60"} /> Add Milestone
      </div>
    </div>
  );
}

function MilestoneAddActive({ project, refetch, deactivate }) {
  const [name, setName] = React.useState("");
  const [dueDate, setDueDate] = React.useState<Date | null>(null);
  const [add, { loading }] = Milestones.useAddMilestone();

  const handleSubmit = async () => {
    if (!name || !dueDate) return;

    await add({
      variables: {
        projectId: project.id,
        title: name,
        deadlineAt: Time.toDateWithoutTime(dueDate),
      },
    });

    await deactivate();
    await refetch();
  };

  const handleCancel = () => {
    deactivate();
  };

  const valid = name.length > 0 && dueDate !== null;

  return (
    <div className="flex items-center border-b border-dark-5 py-2 cursor-pointer px-4">
      <div className="flex items-center gap-2 flex-1 truncate">
        <Icons.IconMapPinFilled size={16} className={"text-white-1/60"} />

        <input
          className="flex-1 bg-transparent outline-none placeholder:text-white-1/60"
          placeholder="e.g. Design Review"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-test-id="milestone-title"
        />
      </div>

      <div className="w-32 flex items-center" data-test-id="milestone-due-date">
        <DatePickerWithClear
          editable={project.permissions.canEditMilestone}
          selected={dueDate}
          onChange={setDueDate}
          clearable={false}
          placeholder="Due Date"
        />
      </div>

      <div className="w-48 flex items-center gap-2 flex-row-reverse">
        <Button onClick={handleCancel} size="tiny" variant="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          size="tiny"
          variant="default"
          disabled={!valid}
          loading={loading}
          data-test-id="save-milestone"
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function MilestoneListItem({ project, milestone, refetch }) {
  const iconColor = milestoneIconColor(milestone);

  return (
    <div className="flex items-center border-b border-dark-5 py-2 group hover:bg-shade-1 px-4">
      <div className="flex items-center gap-2 flex-1 truncate">
        <div className="shink-0">
          <Icons.IconMapPinFilled size={16} className={iconColor} />
        </div>

        <MilestoneLink projectID={project.id} milestoneID={milestone.id}>
          {milestone.title}
        </MilestoneLink>
      </div>

      <MilestoneListItemDueDate project={project} milestone={milestone} refetch={refetch} />

      <div className="w-32">
        {milestone.completedAt && <FormattedTime time={milestone.completedAt} format="short-date" />}
      </div>

      <div className="w-16 flex-row-reverse flex items-center gap-2">
        <RemoveMilestoneButton project={project} milestone={milestone} refetch={refetch} />
      </div>
    </div>
  );
}

function RemoveMilestoneButton({ project, milestone, refetch }) {
  const [remove] = Milestones.useRemoveMilestone({
    onCompleted: refetch,
    variables: {
      milestoneId: milestone.id,
    },
  });

  if (!project.permissions.canDeleteMilestone) return null;

  const handleRemove = async () => {
    await remove({
      variables: {
        milestoneId: milestone.id,
      },
    });
  };

  return (
    <IconButton
      tooltip="Delete milestone"
      icon={<Icons.IconTrash size={16} />}
      color="red"
      onClick={handleRemove}
      data-test-id="delete-milestone"
    />
  );
}

function MilestoneListItemDueDate({ project, milestone, refetch }) {
  const editable = milestone.status !== "done" && project.permissions.canEditMilestone;
  const [update] = Milestones.useSetDeadline();

  const change = async (date: Date | null) => {
    await update({
      variables: {
        milestoneId: milestone.id,
        deadlineAt: date ? Time.toDateWithoutTime(date) : null,
      },
    });

    refetch();
  };

  return (
    <div className="w-32 flex items-center gap-2 cursor-pointer -mt-1" data-test-id="change-milestone-due-date">
      <DatePickerWithClear editable={editable} selected={milestone.deadlineAt} onChange={change} clearable={false}>
        <FormattedTime time={milestone.deadlineAt} format="short-date" />
        {editable && (
          <div className="opacity-0 group-hover:opacity-100">
            <Icons.IconCalendarCog size={16} className="text-white-1/60" />
          </div>
        )}
      </DatePickerWithClear>
    </div>
  );
}

function ArrowRight() {
  return <span className="mt-0.5">-&gt;</span>;
}

function Dates() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <StartDate />
        <ArrowRight />
        <DueDate />
      </div>
    </div>
  );
}

function StartDate() {
  const { project, refetch, editable } = React.useContext(Context) as ContextDescriptor;

  const [update] = Projects.useSetProjectStartDateMutation({ onCompleted: refetch });

  const change = (date: Date | null) => {
    update({
      variables: {
        projectId: project.id,
        startDate: date ? Time.toDateWithoutTime(date) : null,
      },
    });
  };

  return (
    <div className="flex flex-col" data-test-id="edit-project-start-date">
      <DatePickerWithClear
        editable={editable}
        selected={project.startedAt}
        onChange={change}
        placeholder="Start Date"
      />
    </div>
  );
}

function DueDate() {
  const { project, refetch, editable } = React.useContext(Context) as ContextDescriptor;

  const [update] = Projects.useSetProjectDueDateMutation({ onCompleted: refetch });

  const change = (date: Date | null) => {
    update({
      variables: {
        projectId: project.id,
        dueDate: date ? Time.toDateWithoutTime(date) : null,
      },
    });
  };

  return (
    <div className="flex flex-col" data-test-id="edit-project-due-date">
      <DatePickerWithClear editable={editable} selected={project.deadline} onChange={change} placeholder="Due Date" />
    </div>
  );
}

function DatePickerWithClear({
  selected,
  onChange,
  editable = true,
  placeholder,
  children = null,
  clearable = true,
}: any) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = Time.parse(selected);

  const handleChange = (date: Date | null) => {
    if (!editable) return;

    onChange(date);
    setOpen(false);
  };

  let trigger: JSX.Element | null = null;

  if (children) {
    trigger = <SelectBox.Trigger className="flex items-center gap-1">{children}</SelectBox.Trigger>;
  } else {
    trigger = (
      <SelectBox.Trigger className="flex items-center gap-1">
        {selectedDate ? (
          <FormattedTime time={selectedDate} format="short-date" />
        ) : (
          <span className="text-white-1/60">{placeholder}</span>
        )}
      </SelectBox.Trigger>
    );
  }

  return (
    <SelectBox.SelectBox editable={editable} activeValue={selectedDate} open={open} onOpenChange={setOpen}>
      {trigger}

      <SelectBox.Popup>
        <DatePicker inline selected={selectedDate} onChange={handleChange} className="border-none"></DatePicker>
        {clearable && <UnsetLink handleChange={handleChange} />}
      </SelectBox.Popup>
    </SelectBox.SelectBox>
  );
}

function UnsetLink({ handleChange }) {
  return (
    <a
      className="font-medium text-blue-400/80 hover:text-blue-400 cursor-pointer underline underline-offset-2 mx-2 -mt-1 pb-1 block"
      onClick={() => handleChange(null)}
    >
      Unset
    </a>
  );
}

function NextMilestone({ project, refetch }) {
  if (project.nextMilestone) {
    return <ExistingNextMilestone project={project} refetch={refetch} />;
  } else {
    return <NoNextMilestones />;
  }
}

function milestoneIconColor(milestone: Milestones.Milestone) {
  const deadline = Time.parse(milestone.deadlineAt);

  if (milestone.status === "done") return "text-green-400";
  if (!deadline) return "text-white-1/60";

  const isOverdue = deadline < Time.today();

  return isOverdue ? "text-red-400" : "text-white-1/60";
}

function ExistingNextMilestone({ project, refetch }) {
  const nextMilestone = project.nextMilestone;
  if (!nextMilestone) return null;

  const deadline = Time.parse(nextMilestone.deadlineAt);
  if (!deadline) return null;

  const isOverdue = deadline < Time.today();
  const iconColor = milestoneIconColor(project.nextMilestone);

  return (
    <div>
      <span className="text-white-2 uppercase text-xs leading-none tracking-wide">NEXT MILESTONE</span>
      <div className="flex items-center gap-1">
        <Icons.IconMapPinFilled size={16} className={iconColor} />
        <MilestoneLink
          projectID={project.id}
          milestoneID={project.nextMilestone.id}
          className="decoration-white-2 hover:decoration-white-1"
        >
          {project.nextMilestone.title}
        </MilestoneLink>
        <span className="mx-1">&middot;</span>
        {isOverdue ? (
          <div className="text-red-400">{Time.daysBetween(deadline, Time.today())} days overdue</div>
        ) : (
          <div className="text-white-2">due in {Time.daysBetween(Time.today(), deadline)} days</div>
        )}
      </div>
    </div>
  );
}

function CompleteMilestoneButton({
  project,
  milestone,
  refetch,
}: {
  project: Projects.Project;
  milestone: any;
  refetch: () => void;
}) {
  const [complete] = Milestones.useSetStatus();

  if (!project.permissions.canEditMilestone) return null;

  const handleComplete = async () => {
    await complete({
      variables: {
        milestoneId: milestone.id,
        status: "done",
      },
    });

    refetch();
  };

  return (
    <IconButton
      tooltip="Mark as completed"
      icon={<Icons.IconCheck size={16} />}
      color="green"
      onClick={handleComplete}
      data-test-id="complete-milestone"
    />
  );
}

function NoNextMilestones() {
  return (
    <div className="flex items-center gap-2">
      <Icons.IconMapPinFilled size={16} className="text-white-1/60" />
      <span className="text-white-1/60">No upcoming milestones</span>
    </div>
  );
}

function Label({ title }) {
  return <div className="font-bold ml-1">{title}</div>;
}

function Phase() {
  const { project, editable } = React.useContext(Context) as ContextDescriptor;
  const navigate = useNavigate();

  const handlePhaseChange = (phase: string) => {
    navigate(`/projects/${project.id}/phase_change/${phase}`);
  };

  return (
    <div className="flex flex-col">
      <ProjectPhaseSelector activePhase={project.phase} editable={editable} onSelected={handlePhaseChange} />
    </div>
  );
}
