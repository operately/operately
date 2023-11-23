import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";
import * as Milestones from "@/graphql/Projects/milestones";
import * as Pages from "@/components/Pages";

import Button, { GhostButton } from "@/components/Button";
import FormattedTime from "@/components/FormattedTime";
import DatePicker from "react-datepicker";

import * as Time from "@/utils/time";

import { useLoadedData, useRefresh } from "./loader";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { createPath } from "@/utils/paths";
import { Link } from "@/components/Link";

export function Page() {
  const { project } = useLoadedData();
  const refetch = useRefresh();

  const [formVisible, setFormVisible] = React.useState(false);
  const showForm = () => setFormVisible(true);
  const hideForm = () => setFormVisible(false);
  const refetchAndHideForm = () => {
    hideForm();
    refetch();
  };

  return (
    <Pages.Page title={["Milestones", project.name]}>
      <Paper.Root size="small">
        <ProjectPageNavigation project={project} />

        <Paper.Body>
          <Title onAddClick={showForm} />
          <AddMilestoneForm visible={formVisible} onCancel={hideForm} onSubmit={refetchAndHideForm} />
          <Content />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title({ onAddClick }) {
  const { project } = useLoadedData();

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <div className="text-2xl font-extrabold ">Milestones</div>
      </div>

      <div>
        {project.permissions.canEditMilestone && (
          <GhostButton onClick={onAddClick} data-test-id="add-milestone">
            Add Milestone
          </GhostButton>
        )}
      </div>
    </div>
  );
}

function Content() {
  const { project } = useLoadedData();

  if (project.milestones!.length === 0) {
    return <EmptyState />;
  } else {
    return <MilestoneList />;
  }
}

function EmptyState() {
  return null;
}

function MilestoneList() {
  const { project } = useLoadedData();
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
  const refetch = useRefresh();

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
    <div className="bg-surface-dimmed p-8 rounded-lg mb-4">
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
          <div className="border border-surface-dimmed rounded-full p-2 cursor-pointer hover:bg-red-400/10 hover:text-red-400">
            <Icons.IconTrash size={16} onClick={trash} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemShow({ milestone, onEditClick }) {
  const { project } = useLoadedData();
  const path = createPath("projects", project.id, "milestones", milestone.id);

  return (
    <div className="flex items-center bg-surface-dimmed px-4 py-2 rounded-lg gap-2 border border-surface-outline">
      <div className="shrink-0">
        <Icons.IconFlag3Filled size={16} className="text-yellow-500" />
      </div>

      <div className="flex-1 font-bold">
        <Link to={path}>{milestone.title}</Link>
      </div>

      <div className="shrink-0">
        <FormattedTime time={milestone.deadlineAt} format="long-date" />
      </div>

      {project.permissions.canEditMilestone && (
        <div className="shrink-0 pl-2" onClick={onEditClick}>
          <Icons.IconPencil size={16} className="text-content-dimmed hover:text-content-accent cursor-pointer" />
        </div>
      )}
    </div>
  );
}

function AddMilestoneForm({ visible, onSubmit, onCancel }) {
  const { project } = useLoadedData();

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
    <div className="bg-surface-dimmed p-8 rounded-lg mb-4">
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
    <div className="cursor-pointer text-content-dimmed hover:text-content-accent">
      <DatePicker
        selected={selected}
        onChange={(date) => setSelected(date)}
        placeholderText="Select date..."
        dateFormat="MMMM d, yyyy"
      />
    </div>
  );
}
