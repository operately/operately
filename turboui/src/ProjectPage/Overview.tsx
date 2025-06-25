import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ProjectPage } from "./index";
import * as TaskBoardTypes from "../TaskBoard/types";
import { Editor as RichEditor, useEditor } from "../RichEditor";
import { DateField } from "../DateField";
import { PersonField } from "../PersonField";
import { AvatarWithName } from "../Avatar/AvatarWithName";
import { ActionList } from "../ActionList";
import { PrimaryButton as Button, GhostButton, SecondaryButton } from "../Button";
import RichContent, { countCharacters, shortenContent } from "../RichContent";
import { isContentEmpty } from "../RichContent/isContentEmpty";
import classNames from "../utils/classnames";
import { SectionHeader } from "../TaskPage/SectionHeader";
import { PieChart } from "../PieChart";
import {
  IconCircleArrowRight,
  IconCircleCheck,
  IconCopy,
  IconFlag,
  IconPlayerPause,
  IconRotateDot,
  IconTrash,
} from "../icons";
import { MilestoneItem } from "./MilestoneItem";

export function Overview(props: ProjectPage.State) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="px-4 py-6">
        <div className="sm:grid sm:grid-cols-12 gap-8">
          <LeftColumn {...props} />
          <Sidebar {...props} />
        </div>
      </div>
    </div>
  );
}

function LeftColumn(props: ProjectPage.State) {
  return (
    <div className="sm:col-span-8 space-y-8">
      <OverviewSection {...props} />
      <TimelineSection {...props} />
    </div>
  );
}

function OverviewSection(props: ProjectPage.State) {
  const descriptionState = useProjectDescriptionState({
    description: props.description,
    onDescriptionChange: props.updateDescription,
    canEdit: props.canEdit,
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
      <div>
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
        mentionedPersonLookup={async () => null} // TODO: Add person lookup if needed
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
}: {
  description?: string;
  onDescriptionChange?: (newDescription: any) => Promise<boolean>;
  canEdit: boolean;
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
    mentionedPersonLookup: async () => null, // TODO: Add person lookup if needed
    peopleSearch: async () => [], // TODO: Add people search if needed
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
  };
}

function TimelineSection(props: ProjectPage.State) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState<Date | null>(null);
  const [addMore, setAddMore] = useState(false);

  const milestones = props.milestones || [];

  // Filter out helper milestones and empty ones
  const validMilestones = milestones.filter(
    (m) => m.name !== "Empty Milestone" && !m.name.toLowerCase().includes("empty") && m.name.trim() !== "",
  );

  // Separate upcoming and completed milestones
  const upcomingMilestones = validMilestones.filter((m) => m.status !== "completed");
  const completedMilestones = validMilestones.filter((m) => m.status === "completed");

  // Sort by due date
  const sortByDueDate = (a: TaskBoardTypes.Milestone, b: TaskBoardTypes.Milestone) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  };

  const sortedUpcoming = upcomingMilestones.sort(sortByDueDate);
  const sortedCompleted = completedMilestones.sort(sortByDueDate);

  const handleAddMilestone = () => {
    if (!newMilestoneName.trim()) return;

    const newMilestone: Omit<TaskBoardTypes.Milestone, "id"> = {
      name: newMilestoneName,
      dueDate: newMilestoneDueDate || undefined,
      status: "active",
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

  const addButton = (
    <GhostButton size="xs" onClick={() => setShowAddForm(true)} testId="add-milestone-button">
      + Add Milestone
    </GhostButton>
  );

  // Calculate completion stats
  const totalMilestones = validMilestones.length;
  const completedCount = completedMilestones.length;
  const remainingCount = upcomingMilestones.length;
  const completionPercentage = totalMilestones > 0 ? (completedCount / totalMilestones) * 100 : 0;

  return (
    <div className="border border-stroke-base rounded-lg bg-surface-base">
      <div className="p-4 border-b border-stroke-base bg-surface-dimmed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SectionHeader title="Milestones" />
            {totalMilestones > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <PieChart size={16} slices={[{ percentage: completionPercentage, color: "var(--color-green-500)" }]} />
                <span className="text-content-accent font-medium">
                  {completedCount}/{totalMilestones} completed
                </span>
              </div>
            )}
          </div>
          {props.canEdit && addButton}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Add Milestone Form */}
        {showAddForm && (
          <div className="bg-surface-dimmed rounded-lg p-4 border-2 border-dashed border-stroke-base">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Milestone name"
                value={newMilestoneName}
                onChange={(e) => setNewMilestoneName(e.target.value)}
                className="w-full px-3 py-2 border border-stroke-base rounded-md focus:ring-2 focus:ring-accent-base focus:border-accent-base"
                autoFocus
                onKeyDown={handleInputKeyDown}
              />
              <DateField
                date={newMilestoneDueDate}
                setDate={setNewMilestoneDueDate}
                placeholder="Target date (optional)"
                emptyStateText="Set target date"
              />
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddMilestone} disabled={!newMilestoneName.trim()}>
                    Add Milestone
                  </Button>
                  <GhostButton size="sm" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </GhostButton>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={addMore} onChange={(e) => setAddMore(e.target.checked)} />
                  Add more
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Milestones */}
        {sortedUpcoming.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-content-accent mb-3">Upcoming ({remainingCount})</h3>
            <div className="space-y-2">
              {sortedUpcoming.map((milestone, index) => (
                <MilestoneItem
                  key={milestone.id}
                  milestone={milestone}
                  canEdit={props.canEdit}
                  onUpdate={props.onMilestoneUpdate}
                  isLast={index === sortedUpcoming.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Milestones */}
        {sortedCompleted.length > 0 && (
          <CollapsibleSection title={`Completed (${completedCount})`} defaultCollapsed>
            <div className="space-y-2">
              {sortedCompleted.map((milestone, index) => (
                <MilestoneItem
                  key={milestone.id}
                  milestone={milestone}
                  canEdit={props.canEdit}
                  onUpdate={props.onMilestoneUpdate}
                  isLast={index === sortedCompleted.length - 1}
                />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Empty State */}
        {validMilestones.length === 0 && (
          <div className="text-center py-8 text-content-dimmed">
            <IconFlag size={48} className="mx-auto mb-4 text-content-subtle" />
            <p className="text-sm">No milestones yet</p>
            <p className="text-xs mt-1">Add milestones to track key deliverables and deadlines</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  children,
  defaultCollapsed = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}) {
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

function Sidebar(props: ProjectPage.State) {
  return (
    <div className="sm:col-span-4 space-y-6 sm:pl-8">
      <LastCheckIn {...props} />
      <ParentGoal {...props} />
      <ProjectDates {...props} />
      <Champion {...props} />
      <Contributors {...props} />
      <NotificationToggle {...props} />
      <Actions {...props} />
    </div>
  );
}

function LastCheckIn(_props: ProjectPage.State) {
  // This would show the most recent check-in
  // For now, showing placeholder
  return (
    <SidebarSection title="Last Check-In">
      <div className="text-sm text-content-dimmed">No check-ins yet</div>
    </SidebarSection>
  );
}

function ParentGoal(_props: ProjectPage.State) {
  // This would show the parent goal if any
  return (
    <SidebarSection title="Parent Goal">
      <div className="text-sm text-content-dimmed">No parent goal</div>
    </SidebarSection>
  );
}

function ProjectDates(props: ProjectPage.State) {
  return (
    <div className="space-y-4">
      <SidebarSection title="Start Date">
        <DateField
          date={null} // TODO: Add start date to props
          setDate={() => {}} // TODO: Add start date handler
          readonly={!props.canEdit}
          placeholder="Set start date"
        />
      </SidebarSection>

      <SidebarSection title="Due Date">
        <DateField
          date={null} // TODO: Add due date to props
          setDate={() => {}} // TODO: Add due date handler
          readonly={!props.canEdit}
          placeholder="Set due date"
        />
      </SidebarSection>
    </div>
  );
}

function Champion(props: ProjectPage.State) {
  return (
    <SidebarSection title="Champion">
      <PersonField
        person={props.champion}
        setPerson={props.setChampion}
        readonly={!props.canEdit}
        searchPeople={async () => []} // TODO: Add person search
        emptyStateMessage="Set champion"
        emptyStateReadOnlyMessage="No champion"
      />
    </SidebarSection>
  );
}

function Contributors(_props: ProjectPage.State) {
  // Mock contributors for now
  const contributors = [
    {
      id: "1",
      fullName: "Alice Johnson",
      avatarUrl: "https://i.pravatar.cc/150?u=alice",
      profileLink: "/people/alice",
    },
    { id: "2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob", profileLink: "/people/bob" },
  ];

  return (
    <SidebarSection title="Contributors">
      {contributors.length > 0 ? (
        <div className="space-y-2">
          {contributors.map((person) => (
            <AvatarWithName key={person.id} person={person} size="small" link={person.profileLink} nameFormat="short" />
          ))}
        </div>
      ) : (
        <div className="text-sm text-content-dimmed">No contributors</div>
      )}
    </SidebarSection>
  );
}

function NotificationToggle(_props: ProjectPage.State) {
  const [isSubscribed, setIsSubscribed] = useState(true);

  return (
    <SidebarSection title="Notifications">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isSubscribed}
          onChange={(e) => setIsSubscribed(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm">Subscribe to updates</span>
      </label>
    </SidebarSection>
  );
}

function Actions(props: ProjectPage.State) {
  const actions = [
    {
      type: "action" as const,
      label: "Copy URL",
      onClick: () => navigator.clipboard?.writeText(window.location.href),
      icon: IconCopy,
    },
    {
      type: "action" as const,
      label: "Move to another space",
      onClick: () => console.log("Move to another space"),
      icon: IconCircleArrowRight,
      hidden: !props.canEdit,
    },
    {
      type: "action" as const,
      label: "Pause project",
      onClick: () => console.log("Pause project"),
      icon: IconPlayerPause,
      hidden: !props.canEdit || props.state === "closed",
    },
    {
      type: "link" as const,
      label: "Close project",
      link: props.closeLink,
      icon: IconCircleCheck,
      hidden: !props.canEdit || props.state === "closed",
    },
    {
      type: "link" as const,
      label: "Re-open project",
      link: props.reopenLink,
      icon: IconRotateDot,
      hidden: !props.canEdit || props.state !== "closed",
    },
    {
      type: "action" as const,
      label: "Delete",
      onClick: () => console.log("Delete project"),
      icon: IconTrash,
      hidden: !props.canEdit,
      danger: true,
    },
  ];

  const visibleActions = actions.filter((action) => !action.hidden);
  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-4">
      <ActionList actions={visibleActions} />
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-bold text-sm mb-1.5">{title}</div>
      {children}
    </div>
  );
}
