import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PrimaryButton as Button, GhostButton, PrimaryButton, SecondaryButton } from "../Button";
import { DateField } from "../DateField";
import { PieChart } from "../PieChart";
import { ResourceManager } from "../ResourceManager";
import RichContent, { countCharacters, shortenContent } from "../RichContent";
import { isContentEmpty } from "../RichContent/isContentEmpty";
import { MentionedPersonLookupFn, Editor as RichEditor, useEditor } from "../RichEditor";
import { SwitchToggle } from "../SwitchToggle";
import * as TaskBoardTypes from "../TaskBoard/types";
import { SectionHeader } from "../TaskPage/SectionHeader";
import { IconFlag } from "../icons";
import classNames from "../utils/classnames";
import { MilestoneItem } from "./MilestoneItem";
import { OverviewSidebar } from "./OverviewSidebar";
import { ProjectPage } from "./index";
import { SearchFn } from "../RichEditor/extensions/MentionPeople";

export function Overview(props: ProjectPage.State) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="px-4 py-6">
        <div className="sm:grid sm:grid-cols-12 gap-8">
          <LeftColumn {...props} />
          <OverviewSidebar {...props} />
        </div>
      </div>
    </div>
  );
}

function LeftColumn(props: ProjectPage.State) {
  return (
    <div className="sm:col-span-8 space-y-8">
      <OverviewSection {...props} />
      <div className="pt-8 mt-8 border-t border-surface-outline">
        <TimelineSection {...props} />
      </div>
      <div className="pt-8 mt-8 border-t border-surface-outline">
        <ResourcesSection {...props} />
      </div>
    </div>
  );
}

function OverviewSection(props: ProjectPage.State) {
  const descriptionState = useProjectDescriptionState({
    description: props.description,
    onDescriptionChange: props.updateDescription,
    canEdit: props.canEdit,
    mentionedPersonLookup: props.mentionedPersonLookup,
    mentionedPersonSearch: props.mentionedPersonSearch,
  });

  return (
    <div>
      <ProjectDescription state={descriptionState} canEdit={props.canEdit} />
    </div>
  );
}

// Project description component similar to MilestonePage
interface ProjectDescriptionProps {
  state: ProjectDescriptionState;
  canEdit: boolean;
}

function ProjectDescription({ state, canEdit }: ProjectDescriptionProps) {
  if (state.mode === "zero" && !canEdit) return null;

  if (state.mode === "zero") {
    return (
      <div className="py-4">
        <button
          onClick={state.startEdit}
          className="text-content-dimmed hover:text-content-base text-sm transition-colors cursor-pointer"
        >
          Add a project description...
        </button>
      </div>
    );
  }

  const editButton = (
    <SecondaryButton size="xxs" onClick={state.startEdit}>
      Edit
    </SecondaryButton>
  );

  return (
    <div>
      <SectionHeader title="Description" buttons={editButton} showButtons={canEdit && state.mode !== "edit"} />

      {state.mode === "view" && <ProjectDescriptionContent state={state} />}
      {state.mode === "edit" && <ProjectDescriptionEditor state={state} />}
    </div>
  );
}

function ProjectDescriptionContent({ state }: { state: ProjectDescriptionState }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // For HTML strings, we'll display them directly instead of using RichContent parsing
  if (typeof state.description === "string" && state.description.includes("<")) {
    return (
      <div className="mt-2">
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: state.description }} />
      </div>
    );
  }

  // For JSON content, use the rich content system
  const length = useMemo(() => {
    return state.description ? countCharacters(state.description, { skipParse: true }) : 0;
  }, [state.description]);

  const displayedDescription = useMemo(() => {
    if (length <= 200) {
      return state.description;
    } else if (isExpanded) {
      return state.description;
    } else {
      return shortenContent(state.description!, 200, { suffix: "...", skipParse: true });
    }
  }, [state.description, length, isExpanded]);

  return (
    <div className="mt-2">
      <RichContent
        content={displayedDescription}
        mentionedPersonLookup={state.mentionedPersonLookup}
      />

      {length > 200 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-content-dimmed hover:underline text-sm mt-1 font-medium"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      )}
    </div>
  );
}

function ProjectDescriptionEditor({ state }: { state: ProjectDescriptionState }) {
  return (
    <div className="mt-2">
      <RichEditor editor={state.editor} />
      <div className="flex gap-2 mt-2">
        <Button size="xs" onClick={state.save}>
          Save
        </Button>
        <SecondaryButton size="xs" onClick={state.cancel}>
          Cancel
        </SecondaryButton>
      </div>
    </div>
  );
}

// State management for project description
interface ProjectDescriptionState {
  description: string | null;
  mode: "view" | "edit" | "zero";
  setMode: React.Dispatch<React.SetStateAction<"view" | "edit" | "zero">>;
  setDescription: React.Dispatch<React.SetStateAction<string | null>>;
  mentionedPersonLookup: MentionedPersonLookupFn;
  editor: ReturnType<typeof useEditor>;
  startEdit: () => void;
  save: () => void;
  cancel: () => void;
}

// Helper function to safely check if content is empty for HTML strings
function isDescriptionEmpty(description?: string): boolean {
  if (!description) return true;
  if (typeof description === "string") {
    // For HTML strings, check if they're empty or just contain empty tags
    const trimmed = description.trim();
    if (trimmed === "") return true;
    if (trimmed === "<p></p>") return true;
    if (trimmed.match(/^<p>\s*<\/p>$/)) return true;
    return false;
  }
  // For JSON content, use the existing function
  return isContentEmpty(description);
}

function useProjectDescriptionState({
  description: initialDescription,
  onDescriptionChange,
  canEdit,
  mentionedPersonLookup,
  mentionedPersonSearch,
}: {
  description?: string;
  onDescriptionChange?: (newDescription: any) => Promise<boolean>;
  canEdit: boolean;
  mentionedPersonLookup: MentionedPersonLookupFn;
  mentionedPersonSearch: SearchFn;
}): ProjectDescriptionState {
  const initialMode = isDescriptionEmpty(initialDescription) ? "zero" : "view";

  const [description, setDescription] = useState<string | null>(initialDescription || null);
  const [mode, setMode] = useState<"view" | "edit" | "zero">(initialMode);

  useEffect(() => {
    setDescription(initialDescription || null);
  }, [initialDescription]);

  const editor = useEditor({
    content: initialDescription,
    editable: canEdit,
    placeholder: "Add a project description...",
    mentionedPersonLookup: mentionedPersonLookup,
    peopleSearch: mentionedPersonSearch,
  });

  const save = useCallback(async () => {
    if (!onDescriptionChange) return;

    const content = editor.getJson();
    const success = await onDescriptionChange(content);

    if (success) {
      setDescription(content);

      if (isContentEmpty(content)) {
        setMode("zero");
      } else {
        setMode("view");
      }
    }
  }, [editor, setDescription, setMode, onDescriptionChange]);

  const cancel = useCallback(() => {
    if (isDescriptionEmpty(description || undefined)) {
      setMode("zero");
    } else {
      setMode("view");
    }
  }, [setMode, description]);

  const startEdit = useCallback(() => {
    editor.setContent(initialDescription);
    editor.setFocused(true);
    setMode("edit");
  }, [setMode, editor, initialDescription]);

  return {
    description,
    mode,
    editor,
    startEdit,
    setMode,
    setDescription,
    save,
    cancel,
    mentionedPersonLookup,
  };
}

function TimelineSection(props: ProjectPage.State) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState<DateField.ContextualDate | null>(null);
  const [addMore, setAddMore] = useState(false);

  const milestones = props.milestones || [];

  // Filter out helper milestones and empty ones
  const validMilestones = milestones.filter(
    (m) => m.name !== "Empty Milestone" && !m.name.toLowerCase().includes("empty") && m.name.trim() !== "",
  );

  // Separate upcoming and completed milestones
  const upcomingMilestones = validMilestones.filter((m) => m.status !== "done");
  const completedMilestones = validMilestones.filter((m) => m.status === "done");

  const sortedUpcoming = upcomingMilestones.sort(sortByDueDate);
  const sortedCompleted = completedMilestones.sort(sortByDueDate);

  const handleAddMilestone = () => {
    if (!newMilestoneName.trim()) return;

    const newMilestone: ProjectPage.NewMilestonePayload = {
      name: newMilestoneName,
      dueDate: newMilestoneDueDate || undefined,
      status: "pending",
    };

    props.onMilestoneCreate?.(newMilestone);
    setNewMilestoneName("");
    setNewMilestoneDueDate(null);

    if (!addMore) {
      setShowAddForm(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddMilestone();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowAddForm(false);
    }
  };

  // Calculate completion stats
  const totalMilestones = validMilestones.length;
  const completedCount = completedMilestones.length;
  const completionPercentage = totalMilestones > 0 ? (completedCount / totalMilestones) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header with inline completion stats */}
      <div className="flex items-center gap-2">
        <SectionHeader title="Milestones" />
        {totalMilestones > 0 && (
          <div className="flex items-center gap-1 text-sm text-content-accent">
            <PieChart size={16} slices={[{ percentage: completionPercentage, color: "var(--color-green-500)" }]} />
            <span>
              {completedCount}/{totalMilestones} completed
            </span>
          </div>
        )}
        {props.canEdit && (
          <SecondaryButton size="xxs" onClick={() => setShowAddForm(true)} testId="add-milestone-button">
            Add milestone
          </SecondaryButton>
        )}
      </div>

      <div className="space-y-6">
        {sortedUpcoming.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-content-accent mb-3">Upcoming</h3>
            <MilestoneList
              milestones={sortedUpcoming}
              canEdit={props.canEdit}
              onMilestoneUpdate={props.onMilestoneUpdate}
            />
          </div>
        )}

        {sortedCompleted.length > 0 && (
          <CollapsibleSection title={`Show ${completedCount} completed`} defaultCollapsed>
            <MilestoneList
              milestones={sortedCompleted}
              canEdit={props.canEdit}
              onMilestoneUpdate={props.onMilestoneUpdate}
            />
          </CollapsibleSection>
        )}

        <EmptyState canEdit={props.canEdit} setShowAddForm={setShowAddForm} display={validMilestones.length === 0 && !showAddForm} />

        <AddMilestoneForm
          showAddForm={showAddForm}
          newMilestoneName={newMilestoneName}
          setNewMilestoneName={setNewMilestoneName}
          newMilestoneDueDate={newMilestoneDueDate}
          setNewMilestoneDueDate={setNewMilestoneDueDate}
          addMore={addMore}
          setAddMore={setAddMore}
          handleAddMilestone={handleAddMilestone}
          handleInputKeyDown={handleInputKeyDown}
          setShowAddForm={setShowAddForm}
        />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  display: boolean;
  canEdit: boolean;
  setShowAddForm: (show: boolean) => void;
}

function EmptyState({ canEdit, setShowAddForm, display }: EmptyStateProps) {
  if (!display) return null;

  return (
    <div className="text-center py-8 text-content-dimmed">
      <IconFlag size={48} className="mx-auto mb-4 text-content-subtle" />
      <p className="text-sm mb-1">No milestones yet</p>
      {canEdit && (
        <div>
          <p className="text-xs mb-4">Add milestones to track key deliverables and deadlines</p>
          <GhostButton size="sm" onClick={() => setShowAddForm(true)}>
            Add your first milestone
          </GhostButton>
        </div>
      )}
    </div>
  );
}

interface MilestoneListProps {
  milestones: TaskBoardTypes.Milestone[];
  canEdit: boolean;
  onMilestoneUpdate?: (milestoneId: string, updates: TaskBoardTypes.UpdateMilestonePayload) => void;
}

function MilestoneList({ milestones, canEdit, onMilestoneUpdate }: MilestoneListProps) {
  return (
    <div className="space-y-2">
      {milestones.map((milestone, index) => (
        <MilestoneItem
          key={milestone.id}
          milestone={milestone}
          canEdit={canEdit}
          onUpdate={onMilestoneUpdate}
          isLast={index === milestones.length - 1}
        />
      ))}
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

function CollapsibleSection({ title, children, defaultCollapsed = false }: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 text-sm font-medium text-content-accent mb-3 hover:text-content-strong transition-colors"
      >
        <div className={classNames("transition-transform", isCollapsed ? "rotate-0" : "rotate-90")}>▶</div>
        {title}
      </button>
      {!isCollapsed && children}
    </div>
  );
}

function ResourcesSection(props: ProjectPage.State) {
  return (
    <ResourceManager
      resources={props.resources}
      onResourceAdd={props.onResourceAdd}
      onResourceEdit={props.onResourceEdit}
      onResourceRemove={props.onResourceRemove}
      canEdit={props.canEdit}
    />
  );
}

interface AddMilestoneFormProps {
  showAddForm: boolean;
  newMilestoneName: string;
  setNewMilestoneName: (name: string) => void;
  newMilestoneDueDate: DateField.ContextualDate | null;
  setNewMilestoneDueDate: (date: DateField.ContextualDate | null) => void;
  addMore: boolean;
  setAddMore: (addMore: boolean) => void;
  handleAddMilestone: () => void;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  setShowAddForm: (show: boolean) => void;
}

function AddMilestoneForm({
  showAddForm,
  newMilestoneName,
  setNewMilestoneName,
  newMilestoneDueDate,
  setNewMilestoneDueDate,
  addMore,
  setAddMore,
  handleAddMilestone,
  handleInputKeyDown,
  setShowAddForm,
}: AddMilestoneFormProps) {
  if (!showAddForm) return null;

  return (
    <div className="bg-surface-dimmed rounded-lg p-4 border-2 border-dashed border-stroke-base">
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Milestone name"
          value={newMilestoneName}
          onChange={(e) => setNewMilestoneName(e.target.value)}
          className="w-full px-3 py-2 border border-stroke-base rounded-md focus:ring-2 focus:ring-accent-base focus:border-accent-base bg-surface-base"
          autoFocus
          onKeyDown={handleInputKeyDown}
        />
        <DateField date={newMilestoneDueDate} onDateSelect={setNewMilestoneDueDate} placeholder="Set target date" />
        <div className="flex items-center gap-4 justify-between">
          <SwitchToggle value={addMore} setValue={setAddMore} label="Create more" />
          <div className="flex-1"></div>
          <div className="flex gap-2">
            <SecondaryButton size="sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton size="sm" onClick={handleAddMilestone} disabled={!newMilestoneName.trim()}>
              Add milestone
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

const sortByDueDate = (a: TaskBoardTypes.Milestone, b: TaskBoardTypes.Milestone) => {
  if (!a.dueDate && !b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return a.dueDate.date?.getTime() - b.dueDate.date?.getTime();
};
