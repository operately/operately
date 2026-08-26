import React, { useState } from "react";
import { DateField } from "../DateField";
import { TaskCreationModal } from "../TaskCreationModal";
import * as Types from "../TaskBoard/types";
import { Timeline } from "../Timeline";
import { IconCheck, IconFlag, IconFlagFilled } from "../icons";
import { IconClipboardText, IconListCheck, IconMessageCircle, IconPaperclip } from "../icons";
import { ProjectPageLayout } from "../ProjectPageLayout";
import { useProjectPageTabs } from "../ProjectPageLayout/useProjectPageTabs";
import { Sidebar } from "./components/Sidebar";
import { DeleteModal } from "./components/DeleteModal";
import { Header } from "./components/Header";
import { TasksSection } from "./components/TasksSection";
import { CompleteMilestoneModal } from "./components/CompleteMilestoneModal";
import { SidebarSection } from "../SidebarSection";
import { GhostButton, SecondaryButton } from "../Button";
import { launchConfetti } from "../utils/confetti";
import { PageDescription } from "../PageDescription";
import { RelativeDayField } from "../RelativeDayField";
import { useTabs } from "../Tabs";
import type { MilestonePage as MilestonePageTypes } from "./types";
import { isProjectMilestoneState, isTemplateMilestoneProps, isTemplateMilestoneState } from "./types";
import { variantFeatures } from "./variantFeatures";

export namespace MilestonePage {
  export type Variant = MilestonePageTypes.Variant;
  export type VariantFeatures = MilestonePageTypes.VariantFeatures;
  export type Milestone = MilestonePageTypes.Milestone;
  export type TimelineItemType = MilestonePageTypes.TimelineItemType;
  export type SpaceProps = MilestonePageTypes.SpaceProps;
  export type Person = MilestonePageTypes.Person;
  export type Status = MilestonePageTypes.Status;
  export type OpenTasksResolution = MilestonePageTypes.OpenTasksResolution;
  export type ProjectProps = MilestonePageTypes.ProjectProps;
  export type TemplateProps = MilestonePageTypes.TemplateProps;
  export type Props = MilestonePageTypes.Props;
  export type ProjectState = MilestonePageTypes.ProjectState;
  export type TemplateState = MilestonePageTypes.TemplateState;
  export type State = MilestonePageTypes.State;
  export type ContentState = MilestonePageTypes.State;
}

type ModalState = ReturnType<typeof useMilestonePageModalState>;

function useMilestonePageModalState() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return {
    isTaskModalOpen,
    setIsTaskModalOpen,
    isDeleteModalOpen,
    openDeleteModal: () => setIsDeleteModalOpen(true),
    closeDeleteModal: () => setIsDeleteModalOpen(false),
  };
}

function useMilestonePageState(props: MilestonePage.Props, modalState: ModalState): MilestonePage.ContentState {
  if (isTemplateMilestoneProps(props)) {
    const canEdit = !props.template.archived && Boolean(props.permissions.canEdit || props.permissions.hasFullAccess);

    return {
      ...props,
      ...modalState,
      permissions: { ...props.permissions, canEdit },
    };
  }

  return {
    ...props,
    ...modalState,
  };
}

export function MilestonePage(props: MilestonePage.Props) {
  const modalState = useMilestonePageModalState();
  const state = useMilestonePageState(props, modalState);

  if (isTemplateMilestoneState(state)) {
    return <TemplateMilestoneLayout state={state} />;
  }

  return <ProjectMilestoneLayout state={state} />;
}

function ProjectMilestoneLayout({ state }: { state: MilestonePage.ProjectState }) {
  const statusActions = useMilestoneStatusActions(state);
  const contentState = { ...state, onStatusChange: statusActions.requestStatusChange };
  const tabs = useProjectPageTabs({
    defaultTab: "tasks",
    childrenCount: state.childrenCount,
    showDocsAndFiles: true,
    urlPath: state.projectLink,
  });

  const spaceProps =
    "space" in state ? { space: state.space, workmapLink: state.workmapLink } : { homeLink: state.homeLink };

  const handleCreateTask = (newTask: Types.NewTaskPayload) => {
    state.onTaskCreate?.({
      ...newTask,
      milestone: state.milestone,
    });
  };

  return (
    <ProjectPageLayout
      projectName={state.projectName}
      title={[state.projectName]}
      testId="milestone-page"
      tabs={tabs}
      status={state.projectStatus ?? "active"}
      updateProjectName={state.updateProjectName}
      closedAt={null}
      permissions={state.permissions}
      {...spaceProps}
    >
      <MainContainer>
        <MilestoneContent {...contentState} />
      </MainContainer>

      <TaskCreationModal
        variant="project"
        isOpen={state.isTaskModalOpen}
        onClose={() => state.setIsTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
        assigneePersonSearch={state.assigneePersonSearch}
        currentMilestoneId={state.milestone.id}
        milestones={[state.milestone]}
        onMilestoneSearch={async () => {}}
        milestoneReadOnly={true}
        richTextHandlers={state.richTextHandlers}
        formattedTimePreferences={state.formattedTimePreferences}
      />

      <CompleteMilestoneModal
        isOpen={statusActions.isCompletionModalOpen}
        milestoneName={state.title}
        openTaskCount={statusActions.openTasks.length}
        closedStatuses={statusActions.closedStatuses}
        onClose={statusActions.closeCompletionModal}
        onComplete={statusActions.completeMilestone}
      />
    </ProjectPageLayout>
  );
}

function useMilestoneStatusActions(state: MilestonePage.ProjectState) {
  const [isCompletionModalOpen, setIsCompletionModalOpen] = React.useState(false);
  const openTasks = React.useMemo(() => state.tasks.filter((task) => !isClosedTask(task)), [state.tasks]);
  const closedStatuses = React.useMemo(() => state.statusOptions.filter(isClosedStatus), [state.statusOptions]);

  const requestStatusChange = async (nextStatus: MilestonePage.Status): Promise<boolean> => {
    if (nextStatus === "done" && openTasks.length > 0) {
      setIsCompletionModalOpen(true);
      return false;
    }

    const updated = (await state.onStatusChange(nextStatus)) !== false;
    if (updated && nextStatus === "done") {
      launchConfetti();
    }

    return updated;
  };

  const completeMilestone = async (resolution: MilestonePageTypes.OpenTasksResolution) => {
    const updated = (await state.onStatusChange("done", resolution)) !== false;
    if (updated) {
      launchConfetti();
    }

    return updated;
  };

  return {
    isCompletionModalOpen,
    openTasks,
    closedStatuses,
    requestStatusChange,
    completeMilestone,
    closeCompletionModal: () => setIsCompletionModalOpen(false),
  };
}

function isClosedTask(task: Types.Task) {
  return Boolean(task.closedAt) || (task.status ? isClosedStatus(task.status) : false);
}

function isClosedStatus(status: Types.Status) {
  return (
    Boolean(status.closed) ||
    status.color === "green" ||
    status.color === "red" ||
    status.value === "done" ||
    status.value === "completed" ||
    status.value === "canceled"
  );
}

function TemplateMilestoneLayout({ state }: { state: MilestonePage.TemplateState }) {
  const tabs = useTabs(
    "tasks",
    [
      { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
      { id: "tasks", label: "Tasks", icon: <IconListCheck size={14} />, count: state.tasksCount },
      { id: "discussions", label: "Discussions", icon: <IconMessageCircle size={14} />, count: state.discussionsCount },
      {
        id: "docs-and-files",
        label: "Docs & Files",
        icon: <IconPaperclip size={14} />,
        count: state.docsAndFilesCount,
      },
    ],
    { urlPath: state.templateLink },
  );

  return (
    <ProjectPageLayout
      mode="template"
      title={[state.template.name]}
      testId="template-milestone-page"
      projectName={state.template.name}
      updateProjectName={state.updateTemplateName}
      permissions={state.permissions}
      space={state.space}
      workmapLink={state.projectTemplatesLink}
      projectTemplatesLink={state.projectTemplatesLink}
      tabs={tabs}
      archived={state.template.archived}
    >
      <MainContainer>
        <MilestoneContent {...state} />
      </MainContainer>

      <TaskCreationModal
        variant="project-template"
        isOpen={state.isTaskModalOpen}
        onClose={() => state.setIsTaskModalOpen(false)}
        onCreateTask={(task) => state.onTaskCreate?.(task)}
        milestones={state.milestones}
        currentMilestoneId={state.milestoneId}
        milestoneReadOnly
        statuses={state.statuses}
        personSearch={state.personSearch}
        richTextHandlers={state.richTextHandlers}
      />
    </ProjectPageLayout>
  );
}

export function MilestoneContent(props: MilestonePage.ContentState) {
  const features = variantFeatures(props.variant);
  const canEdit = props.permissions.canEdit || false;

  return (
    <>
      <Header
        variant={props.variant}
        title={props.title}
        canEdit={canEdit}
        status={features.showStatus && isProjectMilestoneState(props) ? props.status : undefined}
        onMilestoneTitleChange={props.onMilestoneTitleChange}
      />

      <MobileMeta {...props} />

      <div className="sm:grid sm:grid-cols-12">
        <div className="space-y-4 sm:col-span-8 sm:px-4">
          <PageDescription
            description={props.description}
            onDescriptionChange={props.onDescriptionChange}
            richTextHandlers={props.richTextHandlers}
            canEdit={canEdit}
            label="Notes"
            placeholder="Describe the milestone..."
            zeroStatePlaceholder="Add details about this milestone..."
            emptyTestId="description-section-empty"
            localDraftKey={props.localDraftKeyBase ? `${props.localDraftKeyBase}:description` : undefined}
          />

          <TasksSection {...props} />

          {isProjectMilestoneState(props) && <TimelineSection {...props} />}
        </div>

        <Sidebar {...props} />
      </div>

      <DeleteModal {...props} />
    </>
  );
}

function MobileMeta(props: MilestonePage.ContentState) {
  const features = variantFeatures(props.variant);
  const canEdit = props.permissions.canEdit || false;

  if (features.showRelativeDueDate && isTemplateMilestoneState(props)) {
    return (
      <div className="mb-6 mt-4 sm:hidden" data-test-id={features.mobileMetaTestId}>
        <SidebarSection title="Relative due date">
          <RelativeDayField
            value={props.dueOffsetDays}
            onChange={props.onDueOffsetDaysChange}
            readonly={!canEdit}
            placeholder="Set relative date"
          />
        </SidebarSection>
      </div>
    );
  }

  if (!features.showCalendarDueDate || !isProjectMilestoneState(props)) {
    return null;
  }

  const { status, onStatusChange, dueDate, onDueDateChange, milestone } = props;
  const isCompleted = status === "done";
  const showOverdueWarning = !isCompleted;

  const handleStatusToggle = () => {
    if (!canEdit) return;

    const nextStatus = isCompleted ? "pending" : "done";
    void onStatusChange(nextStatus);
  };

  return (
    <div className="mb-6 mt-4 sm:hidden" data-test-id={features.mobileMetaTestId}>
      <div className="flex flex-wrap gap-4">
        {features.showCalendarDueDate && (
          <SidebarSection title="Due date" className="min-w-[160px] flex-1">
            <DateField
              date={dueDate ?? milestone.dueDate ?? null}
              onDateSelect={onDueDateChange}
              readonly={!canEdit}
              showOverdueWarning={showOverdueWarning}
              placeholder="Set due date"
              size="small"
            />
          </SidebarSection>
        )}

        {features.showStatus && (
          <SidebarSection title="Milestone status" className="min-w-[160px] flex-1">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <>
                    <IconFlagFilled size={16} className="text-accent-1" />
                    <span className="font-medium text-accent-1">Completed</span>
                  </>
                ) : (
                  <>
                    <IconFlag size={16} className="text-content-dimmed" />
                    <span className="text-content-base">Active</span>
                  </>
                )}
              </div>

              {canEdit &&
                (isCompleted ? (
                  <SecondaryButton size="xs" onClick={handleStatusToggle}>
                    Reopen
                  </SecondaryButton>
                ) : (
                  <GhostButton size="xs" icon={IconCheck} onClick={handleStatusToggle}>
                    Mark complete
                  </GhostButton>
                ))}
            </div>
          </SidebarSection>
        )}
      </div>
    </div>
  );
}

function MainContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-4">{children}</div>
      </div>
    </div>
  );
}

function TimelineSection(props: MilestonePage.ProjectState) {
  if (!variantFeatures(props.variant).showActivity) return null;

  return (
    <div className="pt-8" data-test-id="timeline-section">
      <h3 className="mb-4 font-bold">Comments & Activity</h3>
      <Timeline
        items={props.timelineItems}
        currentUser={props.currentUser}
        canComment={props.permissions.canComment || false}
        commentParentType="milestone"
        onAddComment={props.onAddComment}
        onEditComment={props.onEditComment}
        onDeleteComment={props.onDeleteComment}
        onAddReaction={props.onAddReaction}
        onRemoveReaction={props.onRemoveReaction}
        richTextHandlers={props.richTextHandlers}
        commentDraftKey={props.localDraftKeyBase ? `${props.localDraftKeyBase}:new-comment` : undefined}
        commentNotificationInfo={{
          entityLabel: "milestone",
          subscribedPeople: props.subscriptions.subscribedPeople ?? [],
          isCurrentUserSubscribed: props.subscriptions.isSubscribed,
          currentUserId: props.currentUser.id,
        }}
        formattedTimePreferences={props.formattedTimePreferences}
      />
    </div>
  );
}
