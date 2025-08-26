import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { DateField } from "../DateField";
import { createContextualDate } from "../DateField/mockData";
import { ResourceManager } from "../ResourceManager";
import { mockEmptyTasks, mockMilestones, mockTasks } from "../TaskBoard/tests/mockData";
import * as TaskBoardTypes from "../TaskBoard/types";
import { genPeople, searchPeopleFn } from "../utils/storybook/genPeople";
import { spaceSearchFn } from "../utils/storybook/spaceSearchFn";
import { ProjectPage } from "./index";

// Helper function to create rich text content for check-ins
function asRichText(content: string): any {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      },
    ],
  };
}

const people = genPeople(5);

const meta: Meta<typeof ProjectPage> = {
  title: "Pages/ProjectPage",
  component: ProjectPage,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock people data for search
const mockPeople: TaskBoardTypes.Person[] = [
  { id: "user-1", fullName: "Alice Johnson", avatarUrl: "https://i.pravatar.cc/150?u=alice" },
  { id: "user-2", fullName: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?u=bob" },
  { id: "user-3", fullName: "Charlie Brown", avatarUrl: "https://i.pravatar.cc/150?u=charlie" },
  { id: "user-4", fullName: "Diana Prince", avatarUrl: null },
];

// Mock contributors data for project sidebar
const mockContributors: ProjectPage.Person[] = [
  {
    id: "1",
    fullName: "Alice Johnson",
    avatarUrl: "https://i.pravatar.cc/150?u=alice",
    profileLink: "/people/alice",
    title: "Frontend Development & UI/UX",
  },
  {
    id: "2",
    fullName: "Bob Smith",
    avatarUrl: "https://i.pravatar.cc/150?u=bob",
    profileLink: "/people/bob",
    title: "Backend Architecture & API Design",
  },
  {
    id: "3",
    fullName: "Charlie Brown",
    avatarUrl: "https://i.pravatar.cc/150?u=charlie",
    profileLink: "/people/charlie",
    title: "Quality Assurance & Testing",
  },
];

const defaultSpace: ProjectPage.Space = {
  id: "1",
  name: "Product",
  link: "#",
};

// Mock search function for people
const mockSearchPeople = async ({ query }: { query: string }) => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
  return mockPeople
    .filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()))
    .map(person => ({
      ...person,
      profileLink: "#", // Add required profileLink property
      title: "Team Member", // Add required title property
    }));
};

// Mock parent goal search
const mockParentGoalSearch = async ({ query }: { query: string }): Promise<ProjectPage.ParentGoal[]> => {
  const goals = [
    { id: "1", name: "Improve Customer Experience", link: "/goals/1" },
    { id: "2", name: "Increase Product Adoption", link: "/goals/2" },
    { id: "3", name: "Expand Market Reach", link: "/goals/3" },
  ];
  return goals.filter((goal) => goal.name.toLowerCase().includes(query.toLowerCase()));
};

// Mock check-ins data
const mockCheckIns: ProjectPage.CheckIn[] = [
  {
    id: "checkin-1",
    author: people[0]!,
    date: new Date(2025, 3, 17), // Apr 17th, 2025
    content: asRichText(
      "Project kickoff meeting completed successfully! The team is aligned on deliverables and timeline. UI wireframes are in progress and backend architecture is being finalized.",
    ),
    link: "/projects/1/check-ins/1",
    commentCount: 5,
    status: "on_track",
  },
  {
    id: "checkin-2",
    author: people[1]!,
    date: new Date(2025, 3, 10), // Apr 10th, 2025
    content: asRichText(
      "First sprint review completed. Made good progress on the authentication module and user interface components. Some minor delays in API integration, but we're adjusting the timeline accordingly.",
    ),
    link: "/projects/1/check-ins/2",
    commentCount: 2,
    status: "caution",
  },
  {
    id: "checkin-3",
    author: people[2]!,
    date: new Date(2025, 3, 3), // Apr 3rd, 2025
    content: asRichText(
      "Database schema finalized and development environment is set up. All team members have access to the repositories and development tools. Ready to start implementation phase next week.",
    ),
    link: "/projects/1/check-ins/3",
    commentCount: 8,
    status: "on_track",
  },
];

const mockDiscussions: ProjectPage.Discussion[] = [
  {
    id: "discussion-1",
    title: "Design Mockups",
    author: people[4]!,
    date: new Date(2025, 3, 17), // Apr 17th, 2025
    link: "/projects/1/discussions/1",
    content: asRichText(
      "Design mockups for the new authentication module. The team is working on the UI wireframes and backend architecture is being finalized.",
    ),
    commentCount: 5,
  },
  {
    id: "discussion-2",
    title: "Authentication Module",
    author: people[3]!,
    date: new Date(2025, 3, 10), // Apr 10th, 2025
    link: "/projects/1/discussions/2",
    content: asRichText(
      "Authentication module is ready for review. The team is working on the UI wireframes and backend architecture is being finalized.",
    ),
    commentCount: 2,
  },
  {
    id: "discussion-3",
    title: "Database Schema",
    author: people[2]!,
    date: new Date(2025, 3, 3), // Apr 3rd, 2025
    link: "/projects/1/discussions/3",
    content: asRichText(
      "Database schema finalized and development environment is set up. All team members have access to the repositories and development tools. Ready to start implementation phase next week.",
    ),
    commentCount: 8,
  },
];

// Mock resources data
const mockResources: ResourceManager.Resource[] = [
  {
    id: "resource-1",
    name: "Tasks Spreadsheet",
    url: "https://docs.google.com/spreadsheets/d/1234567890",
  },
  {
    id: "resource-2",
    name: "Issue description",
    url: "https://github.com/company/repo/issues/123",
  },
  {
    id: "resource-3",
    name: "Design Mockups",
    url: "https://www.figma.com/file/abc123",
  },
];

export const Default: Story = {
  render: () => {
    const [tasks, setTasks] = useState([...mockTasks]);
    const [milestones, setMilestones] = useState<TaskBoardTypes.Milestone[]>(Object.values(mockMilestones));
    const [filters, setFilters] = useState<TaskBoardTypes.FilterCondition[]>([]);
    const [parentGoal, setParentGoal] = useState<ProjectPage.ParentGoal | null>({
      id: "1",
      name: "Improve Customer Experience",
      link: "/goals/1",
    });
    const [reviewer, setReviewer] = useState<ProjectPage.Person | null>(people[2] || null);
    const [startedAt, setStartedAt] = useState<DateField.ContextualDate | null>(() => {
      const startDate = new Date(2025, 2, 15); // March 15, 2025
      return createContextualDate(startDate, "day");
    });
    const [dueAt, setDueAt] = useState<DateField.ContextualDate | null>(() => {
      const oneMonthFromToday = new Date();
      oneMonthFromToday.setMonth(oneMonthFromToday.getMonth() + 1);
      return createContextualDate(oneMonthFromToday, "day");
    });
    const [resources, setResources] = useState<ResourceManager.Resource[]>([...mockResources]);
    const [space, setSpace] = useState(defaultSpace);

    const handleTaskCreate = (newTaskData: TaskBoardTypes.NewTaskPayload) => {
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newTask = { id: taskId, status: "pending" as TaskBoardTypes.Status, description: "", link: "#", ...newTaskData };
      console.log("Task created:", newTask);
      setTasks([...tasks, newTask]);
    };

    const handleMilestoneCreate = (newMilestoneData: ProjectPage.NewMilestonePayload) => {
      const milestoneId = `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newMilestone = { id: milestoneId, ...newMilestoneData };
      console.log("Milestone created:", newMilestone);

      // Add the new milestone to the milestones array
      setMilestones((prev) => [...prev, newMilestone]);
    };

    const handleMilestoneUpdate = (milestoneId: string, updates: TaskBoardTypes.UpdateMilestonePayload) => {
      console.log("Milestone updated:", milestoneId, updates);

      // Update the milestone in the milestones array
      const updatedMilestones = milestones.map((milestone) =>
        milestone.id === milestoneId ? { ...milestone, ...updates } : milestone,
      );
      setMilestones(updatedMilestones);

      const updatedTasks = tasks.map((task) => {
        if (task.milestone?.id === milestoneId) {
          return {
            ...task,
            milestone: { ...task.milestone, ...updates },
          };
        }
        return task;
      });
      setTasks(updatedTasks);
    };

    const handleResourceAdd = (resource: ResourceManager.NewResourcePayload) => {
      const resourceId = `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newResource = { id: resourceId, ...resource };
      console.log("Resource added:", newResource);
      setResources([...resources, newResource]);
    };

    const handleResourceEdit = (updates: ResourceManager.Resource) => {
      console.log("Resource edited:", updates);
      const updatedResources = resources.map((resource) =>
        resource.id === updates.id ? { ...resource, ...updates } : resource,
      );
      setResources(updatedResources);
    };

    const handleResourceRemove = (id: string) => {
      console.log("Resource removed:", id);
      const updatedResources = resources.filter((resource) => resource.id !== id);
      setResources(updatedResources);
    };

    return (
      <ProjectPage
        workmapLink="#"
        closeLink="#"
        reopenLink="#"
        pauseLink="#"
        projectName="Mobile App Redesign"
        description="<p>Redesigning our mobile application to improve user experience and increase engagement. This project includes user research, wireframing, prototyping, and implementation.</p>"
        space={space}
        setSpace={setSpace}
        spaceSearch={spaceSearchFn}
        champion={people[0] || null}
        setChampion={() => {}}
        reviewer={reviewer}
        setReviewer={setReviewer}
        status="on_track"
        state="active"
        closedAt={null}
        canEdit={true}
        updateProjectName={async () => true}
        updateDescription={async () => true}
        activityFeed={<div>Activity feed content</div>}
        tasksEnabled={true}
        tasks={tasks}
        milestones={milestones}
        onTaskCreate={handleTaskCreate}
        onMilestoneCreate={handleMilestoneCreate}
        onTaskAssigneeChange={(taskId, assignee) => {
          console.log('Task assignee updated:', taskId, assignee);
        }}
        onTaskDueDateChange={(taskId, dueDate) => {
          console.log('Task due date updated:', taskId, dueDate);
        }}
        onTaskStatusChange={(taskId, status) => {
          console.log('Task status updated:', taskId, status);
        }}
        onMilestoneUpdate={handleMilestoneUpdate}
        searchPeople={mockSearchPeople}
        mentionedPersonSearch={mockSearchPeople}
        filters={filters}
        onFiltersChange={setFilters}
        mentionedPersonLookup={async () => null}
        parentGoal={parentGoal}
        setParentGoal={setParentGoal}
        parentGoalSearch={mockParentGoalSearch}
        startedAt={startedAt}
        setStartedAt={setStartedAt}
        dueAt={dueAt}
        setDueAt={setDueAt}
        resources={resources}
        onResourceAdd={handleResourceAdd}
        onResourceEdit={handleResourceEdit}
        onResourceRemove={handleResourceRemove}
        contributors={mockContributors}
        manageTeamLink="/projects/1/team"
        championSearch={searchPeopleFn}
        reviewerSearch={searchPeopleFn}
        newCheckInLink="#"
        checkIns={mockCheckIns}
        newDiscussionLink="#"
        discussions={mockDiscussions}
        onProjectDelete={() => {}}
        canDelete={true}
      />
    );
  },
};

export const ReadOnly: Story = {
  render: () => {
    const [tasks] = useState([...mockTasks]);
    const [milestones] = useState<TaskBoardTypes.Milestone[]>(Object.values(mockMilestones));
    const [reviewer, setReviewer] = useState<ProjectPage.Person | null>(people[1] || null); // Set reviewer for read-only story
    const startedAt = createContextualDate(new Date(2025, 1, 1), "day"); // February 1, 2025
    const dueAt = (() => {
      const oneMonthFromToday = new Date();
      oneMonthFromToday.setMonth(oneMonthFromToday.getMonth() + 1);
      return createContextualDate(oneMonthFromToday, "day");
    })();
    const [space, setSpace] = useState(defaultSpace);

    return (
      <ProjectPage
        workmapLink="#"
        closeLink="#"
        reopenLink="#"
        pauseLink="#"
        projectName="Mobile App Redesign"
        description="<p>Redesigning our mobile application to improve user experience and increase engagement. This project includes user research, wireframing, prototyping, and implementation.</p>"
        space={space}
        setSpace={setSpace}
        spaceSearch={spaceSearchFn}
        champion={people[0] || null}
        setChampion={() => {}}
        reviewer={reviewer}
        setReviewer={setReviewer}
        status="on_track"
        state="active"
        closedAt={null}
        canEdit={false}
        updateProjectName={async () => true}
        updateDescription={async () => true}
        activityFeed={<div>Activity feed content</div>}
        tasksEnabled={true}
        tasks={tasks}
        milestones={milestones}
        onTaskStatusChange={() => {}}
        onTaskCreate={() => {}}
        onMilestoneCreate={() => {}}
        onTaskAssigneeChange={() => {}}
        onTaskDueDateChange={() => {}}
        onMilestoneUpdate={() => {}}
        searchPeople={mockSearchPeople}
        mentionedPersonSearch={mockSearchPeople}
        filters={[]}
        onFiltersChange={() => {}}
        mentionedPersonLookup={async () => null}
        parentGoal={{
          id: "2",
          name: "Increase Product Adoption",
          link: "/goals/2",
        }}
        setParentGoal={() => {}}
        parentGoalSearch={mockParentGoalSearch}
        startedAt={startedAt}
        setStartedAt={() => {}}
        dueAt={dueAt}
        setDueAt={() => {}}
        resources={mockResources}
        onResourceAdd={() => {}}
        onResourceEdit={() => {}}
        onResourceRemove={() => {}}
        contributors={mockContributors}
        manageTeamLink="/projects/1/team"
        championSearch={searchPeopleFn}
        reviewerSearch={searchPeopleFn}
        newCheckInLink="#"
        checkIns={mockCheckIns}
        newDiscussionLink="#"
        discussions={[]}
        onProjectDelete={() => {}}
        canDelete={true}
      />
    );
  },
};

export const EmptyTasks: Story = {
  render: () => {
    const [tasks, setTasks] = useState([...mockEmptyTasks]);
    const [milestones, setMilestones] = useState<TaskBoardTypes.Milestone[]>([]);
    const [filters, setFilters] = useState<TaskBoardTypes.FilterCondition[]>([]);
    const [reviewer, setReviewer] = useState<ProjectPage.Person | null>(people[3] || null);
    const [startedAt, setStartedAt] = useState<DateField.ContextualDate | null>(() => {
      const startDate = new Date(2025, 3, 1); // April 1, 2025
      return createContextualDate(startDate, "day");
    });
    const [dueAt, setDueAt] = useState<DateField.ContextualDate | null>(() => {
      const oneMonthFromToday = new Date();
      oneMonthFromToday.setMonth(oneMonthFromToday.getMonth() + 1);
      return createContextualDate(oneMonthFromToday, "day");
    });
    const [resources, setResources] = useState<ResourceManager.Resource[]>([]);
    const [space, setSpace] = useState(defaultSpace);

    const handleTaskCreate = (newTaskData: TaskBoardTypes.NewTaskPayload) => {
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newTask = { id: taskId, status: "pending" as TaskBoardTypes.Status, description: "", link: "#", ...newTaskData };
      console.log("Task created:", newTask);
      setTasks([...tasks, newTask]);
    };

    const handleMilestoneCreate = (newMilestoneData: ProjectPage.NewMilestonePayload) => {
      const milestoneId = `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newMilestone = { id: milestoneId, ...newMilestoneData };
      console.log("Milestone created:", newMilestone);

      // Add the new milestone to the milestones array
      setMilestones((prev) => [...prev, newMilestone]);
    };

    const handleResourceAdd = (resource: ResourceManager.NewResourcePayload) => {
      const resourceId = `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newResource = { id: resourceId, ...resource };
      console.log("Resource added:", newResource);
      setResources([...resources, newResource]);
    };

    const handleResourceEdit = (updates: ResourceManager.Resource) => {
      console.log("Resource edited:", updates);
      const updatedResources = resources.map((resource) =>
        resource.id === updates.id ? { ...resource, ...updates } : resource,
      );
      setResources(updatedResources);
    };

    const handleResourceRemove = (id: string) => {
      console.log("Resource removed:", id);
      const updatedResources = resources.filter((resource) => resource.id !== id);
      setResources(updatedResources);
    };

    return (
      <ProjectPage
        workmapLink="#"
        closeLink="#"
        reopenLink="#"
        pauseLink="#"
        projectName="Mobile App Redesign"
        description="<p>Redesigning our mobile application to improve user experience and increase engagement. This project includes user research, wireframing, prototyping, and implementation.</p>"
        space={space}
        setSpace={setSpace}
        spaceSearch={spaceSearchFn}
        champion={people[0] || null}
        setChampion={() => {}}
        reviewer={reviewer}
        setReviewer={setReviewer}
        status="on_track"
        state="active"
        closedAt={null}
        canEdit={true}
        updateProjectName={async () => true}
        updateDescription={async () => true}
        activityFeed={<div>Activity feed content</div>}
        tasksEnabled={true}
        tasks={tasks}
        milestones={milestones}
        onTaskStatusChange={() => {}}
        onTaskCreate={handleTaskCreate}
        onMilestoneCreate={handleMilestoneCreate}
        onTaskAssigneeChange={() => {}}
        onTaskDueDateChange={() => {}}
        onMilestoneUpdate={() => {}}
        searchPeople={mockSearchPeople}
        mentionedPersonSearch={mockSearchPeople}
        filters={filters}
        onFiltersChange={setFilters}
        mentionedPersonLookup={async () => null}
        parentGoal={null}
        setParentGoal={() => {}}
        parentGoalSearch={mockParentGoalSearch}
        startedAt={startedAt}
        setStartedAt={setStartedAt}
        dueAt={dueAt}
        setDueAt={setDueAt}
        resources={resources}
        onResourceAdd={handleResourceAdd}
        onResourceEdit={handleResourceEdit}
        onResourceRemove={handleResourceRemove}
        contributors={mockContributors}
        manageTeamLink="/projects/1/team"
        championSearch={searchPeopleFn}
        reviewerSearch={searchPeopleFn}
        newCheckInLink="#"
        checkIns={mockCheckIns}
        newDiscussionLink="#"
        discussions={[]}
        onProjectDelete={() => {}}
        canDelete={true}
      />
    );
  },
};

export const EmptyProject: Story = {
  render: () => {
    const [milestones, setMilestones] = useState<TaskBoardTypes.Milestone[]>([]);
    const [startedAt, setStartedAt] = useState<DateField.ContextualDate | null>(null);
    const [dueAt, setDueAt] = useState<DateField.ContextualDate | null>(null);
    const [resources, setResources] = useState<ResourceManager.Resource[]>([]);
    const [space, setSpace] = useState(defaultSpace);

    const handleMilestoneCreate = (newMilestoneData: ProjectPage.NewMilestonePayload) => {
      const milestoneId = `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newMilestone = { id: milestoneId, ...newMilestoneData };
      console.log("Milestone created:", newMilestone);

      // Add the new milestone to the milestones array
      setMilestones((prev) => [...prev, newMilestone]);
    };

    const handleMilestoneUpdate = (milestoneId: string, updates: TaskBoardTypes.UpdateMilestonePayload) => {
      console.log("Milestone updated:", milestoneId, updates);

      // Update the milestone in the milestones array
      const updatedMilestones = milestones.map((milestone) =>
        milestone.id === milestoneId ? { ...milestone, ...updates } : milestone,
      );
      setMilestones(updatedMilestones);
    };

    const handleResourceAdd = (resource: ResourceManager.NewResourcePayload) => {
      const resourceId = `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newResource = { id: resourceId, ...resource };
      console.log("Resource added:", newResource);
      setResources([...resources, newResource]);
    };

    const handleResourceEdit = (updates: ResourceManager.Resource) => {
      console.log("Resource edited:", updates);
      const updatedResources = resources.map((resource) =>
        resource.id === updates.id ? { ...resource, ...updates } : resource,
      );
      setResources(updatedResources);
    };

    const handleResourceRemove = (id: string) => {
      console.log("Resource removed:", id);
      const updatedResources = resources.filter((resource) => resource.id !== id);
      setResources(updatedResources);
    };

    return (
      <ProjectPage
        workmapLink="#"
        closeLink="#"
        reopenLink="#"
        pauseLink="#"
        projectName="New Project"
        description={undefined}
        space={space}
        setSpace={setSpace}
        spaceSearch={spaceSearchFn}
        champion={null}
        setChampion={() => {}}
        status="on_track"
        state="active"
        closedAt={null}
        canEdit={true}
        updateProjectName={async () => true}
        updateDescription={async () => true}
        activityFeed={<div>Activity feed content</div>}
        tasksEnabled={true}
        tasks={[]}
        milestones={milestones}
        onTaskStatusChange={() => {}}
        onTaskCreate={() => {}}
        onMilestoneCreate={handleMilestoneCreate}
        onTaskAssigneeChange={() => {}}
        onTaskDueDateChange={() => {}}
        onMilestoneUpdate={handleMilestoneUpdate}
        searchPeople={mockSearchPeople}
        mentionedPersonSearch={mockSearchPeople}
        filters={[]}
        onFiltersChange={() => {}}
        mentionedPersonLookup={async () => null}
        parentGoal={null}
        setParentGoal={() => {}}
        parentGoalSearch={mockParentGoalSearch}
        startedAt={startedAt}
        setStartedAt={setStartedAt}
        dueAt={dueAt}
        setDueAt={setDueAt}
        resources={resources}
        onResourceAdd={handleResourceAdd}
        onResourceEdit={handleResourceEdit}
        onResourceRemove={handleResourceRemove}
        contributors={[]}
        manageTeamLink="/projects/1/team"
        championSearch={searchPeopleFn}
        reviewerSearch={searchPeopleFn}
        newCheckInLink="#"
        checkIns={[]}
        newDiscussionLink="#"
        discussions={[]}
        onProjectDelete={() => {}}
        canDelete={true}
      />
    );
  },
};

export const EmptyProjectReadOnly: Story = {
  render: () => {
    const [tasks] = useState<TaskBoardTypes.Task[]>([]);
    const [milestones] = useState<TaskBoardTypes.Milestone[]>([]);
    const startedAt = null; // No start date for empty read-only project
    const dueAt = null; // No due date for empty read-only project
    const [space, setSpace] = useState(defaultSpace);

    return (
      <ProjectPage
        workmapLink="#"
        closeLink="#"
        reopenLink="#"
        pauseLink="#"
        projectName="Mobile App Redesign"
        description=""
        space={space}
        setSpace={setSpace}
        spaceSearch={spaceSearchFn}
        champion={null}
        setChampion={() => {}}
        status="on_track"
        state="active"
        closedAt={null}
        canEdit={false}
        updateProjectName={async () => true}
        updateDescription={async () => true}
        activityFeed={<div>Activity feed content</div>}
        tasksEnabled={true}
        tasks={tasks}
        milestones={milestones}
        onTaskStatusChange={() => {}}
        onTaskCreate={() => {}}
        onMilestoneCreate={() => {}}
        onTaskAssigneeChange={() => {}}
        onTaskDueDateChange={() => {}}
        onMilestoneUpdate={() => {}}
        searchPeople={mockSearchPeople}
        mentionedPersonSearch={mockSearchPeople}
        filters={[]}
        onFiltersChange={() => {}}
        mentionedPersonLookup={async () => null}
        parentGoal={null}
        setParentGoal={() => {}}
        parentGoalSearch={mockParentGoalSearch}
        startedAt={startedAt}
        setStartedAt={() => {}}
        dueAt={dueAt}
        setDueAt={() => {}}
        resources={[]}
        onResourceAdd={() => {}}
        onResourceEdit={() => {}}
        onResourceRemove={() => {}}
        contributors={[]}
        manageTeamLink="/projects/1/team"
        championSearch={searchPeopleFn}
        reviewerSearch={searchPeopleFn}
        newCheckInLink="#"
        checkIns={[]}
        newDiscussionLink="#"
        discussions={[]}
        onProjectDelete={() => {}}
        canDelete={true}
      />
    );
  },
};

export const PausedProject: Story = {
  render: () => {
    const [tasks, setTasks] = useState([...mockTasks]);
    const [milestones, setMilestones] = useState<TaskBoardTypes.Milestone[]>(Object.values(mockMilestones));
    const [filters, setFilters] = useState<TaskBoardTypes.FilterCondition[]>([]);
    const [parentGoal, setParentGoal] = useState<ProjectPage.ParentGoal | null>({
      id: "1",
      name: "Improve Customer Experience",
      link: "/goals/1",
    });
    const [reviewer, setReviewer] = useState<ProjectPage.Person | null>(people[2] || null);
    const [startedAt, setStartedAt] = useState<DateField.ContextualDate | null>(() => {
      const startDate = new Date(2025, 2, 15); // March 15, 2025
      return createContextualDate(startDate, "day");
    });
    const [dueAt, setDueAt] = useState<DateField.ContextualDate | null>(() => {
      const oneMonthFromToday = new Date();
      oneMonthFromToday.setMonth(oneMonthFromToday.getMonth() + 1);
      return createContextualDate(oneMonthFromToday, "day");
    });
    const [resources, setResources] = useState<ResourceManager.Resource[]>([...mockResources]);
    const [space, setSpace] = useState(defaultSpace);

    const handleTaskCreate = (newTaskData: TaskBoardTypes.NewTaskPayload) => {
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newTask = { id: taskId, status: "pending" as TaskBoardTypes.Status, description: "", link: "#", ...newTaskData };
      console.log("Task created:", newTask);
      setTasks([...tasks, newTask]);
    };

    const handleMilestoneCreate = (newMilestoneData: ProjectPage.NewMilestonePayload) => {
      const milestoneId = `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newMilestone = { id: milestoneId, ...newMilestoneData };
      console.log("Milestone created:", newMilestone);
      setMilestones((prev) => [...prev, newMilestone]);
    };

    const handleMilestoneUpdate = (milestoneId: string, updates: TaskBoardTypes.UpdateMilestonePayload) => {
      console.log("Milestone updated:", milestoneId, updates);
      const updatedMilestones = milestones.map((milestone) =>
        milestone.id === milestoneId ? { ...milestone, ...updates } : milestone,
      );
      setMilestones(updatedMilestones);

      const updatedTasks = tasks.map((task) => {
        if (task.milestone?.id === milestoneId) {
          return {
            ...task,
            milestone: { ...task.milestone, ...updates },
          };
        }
        return task;
      });
      setTasks(updatedTasks);
    };

    const handleResourceAdd = (resource: ResourceManager.NewResourcePayload) => {
      const resourceId = `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newResource = { id: resourceId, ...resource };
      console.log("Resource added:", newResource);
      setResources([...resources, newResource]);
    };

    const handleResourceEdit = (updates: ResourceManager.Resource) => {
      console.log("Resource edited:", updates);
      const updatedResources = resources.map((resource) =>
        resource.id === updates.id ? { ...resource, ...updates } : resource,
      );
      setResources(updatedResources);
    };

    const handleResourceRemove = (id: string) => {
      console.log("Resource removed:", id);
      const updatedResources = resources.filter((resource) => resource.id !== id);
      setResources(updatedResources);
    };

    return (
      <ProjectPage
        workmapLink="#"
        closeLink="#"
        reopenLink="#"
        pauseLink="#"
        projectName="AI Chatbot Prototype"
        description="<p>This project introduces an intelligent assistant that participates in project discussions through comments. The AI will respond exclusively when team members mention it directly. It's designed to focus solely on discussion threads, without any interactions with project tasks or milestones.</p>"
        space={space}
        setSpace={setSpace}
        spaceSearch={spaceSearchFn}
        champion={people[0] || null}
        setChampion={() => {}}
        reviewer={reviewer}
        setReviewer={setReviewer}
        status="paused"
        state="paused"
        closedAt={null}
        canEdit={true}
        updateProjectName={async () => true}
        updateDescription={async () => true}
        activityFeed={<div>Activity feed content</div>}
        tasksEnabled={true}
        tasks={tasks}
        milestones={milestones}
        onTaskCreate={handleTaskCreate}
        onMilestoneCreate={handleMilestoneCreate}
        onTaskAssigneeChange={(taskId, assignee) => {
          console.log('Task assignee updated:', taskId, assignee);
        }}
        onTaskDueDateChange={(taskId, dueDate) => {
          console.log('Task due date updated:', taskId, dueDate);
        }}
        onTaskStatusChange={(taskId, status) => {
          console.log('Task status updated:', taskId, status);
        }}
        onMilestoneUpdate={handleMilestoneUpdate}
        searchPeople={mockSearchPeople}
        mentionedPersonSearch={mockSearchPeople}
        filters={filters}
        onFiltersChange={setFilters}
        mentionedPersonLookup={async () => null}
        parentGoal={parentGoal}
        setParentGoal={setParentGoal}
        parentGoalSearch={mockParentGoalSearch}
        startedAt={startedAt}
        setStartedAt={setStartedAt}
        dueAt={dueAt}
        setDueAt={setDueAt}
        resources={resources}
        onResourceAdd={handleResourceAdd}
        onResourceEdit={handleResourceEdit}
        onResourceRemove={handleResourceRemove}
        contributors={mockContributors}
        manageTeamLink="/projects/1/team"
        championSearch={searchPeopleFn}
        reviewerSearch={searchPeopleFn}
        newCheckInLink="#"
        checkIns={mockCheckIns}
        newDiscussionLink="#"
        discussions={[]}
        onProjectDelete={() => {}}
        canDelete={true}
      />
    );
  },
};

export const ClosedProject: Story = {
  render: () => {
    const [tasks] = useState([...mockTasks]);
    // All milestones completed for closed project
    const completedMilestones = Object.values(mockMilestones).map((milestone) => ({
      ...milestone,
      status: "done" as const,
    }));
    const [milestones] = useState<TaskBoardTypes.Milestone[]>(completedMilestones);
    const [parentGoal] = useState<ProjectPage.ParentGoal | null>({
      id: "2",
      name: "Operately is a competitive goal-tracking solution",
      link: "/goals/2",
    });
    const [reviewer] = useState<ProjectPage.Person | null>(people[1] || null);
    const [space, setSpace] = useState(defaultSpace);
    const startedAt = createContextualDate("2025-03-01", "day"); // March 1, 2025
    const dueAt = createContextualDate("2025-05-26", "day"); // June 26, 2025
    const closedAt = new Date(2025, 5, 26); // June 26, 2025

    return (
      <ProjectPage
        workmapLink="#"
        closeLink="#"
        reopenLink="#"
        pauseLink="#"
        projectName="Work Map GA"
        description="<p>We're going towards turning the work maps on for everyone and removing legacy UI.</p><p>Milestones (will add after bug is fixed):</p><ul><li>No bugs / papercuts in current work maps</li><li>My work</li><li>Profile pages that show work maps in new layout</li><li>New home section</li></ul>"
        space={space}
        setSpace={setSpace}
        spaceSearch={spaceSearchFn}
        champion={people[0] || null}
        setChampion={() => {}}
        reviewer={reviewer}
        setReviewer={() => {}}
        status="achieved"
        state="closed"
        closedAt={closedAt}
        retrospectiveLink="/projects/work-map-ga/retrospective"
        canEdit={false}
        updateProjectName={async () => true}
        updateDescription={async () => true}
        activityFeed={<div>Activity feed content</div>}
        tasksEnabled={true}
        tasks={tasks}
        milestones={milestones}
        onTaskStatusChange={() => {}}
        onTaskCreate={() => {}}
        onMilestoneCreate={() => {}}
        onTaskAssigneeChange={() => {}}
        onTaskDueDateChange={() => {}}
        onMilestoneUpdate={() => {}}
        searchPeople={mockSearchPeople}
        mentionedPersonSearch={mockSearchPeople}
        filters={[]}
        onFiltersChange={() => {}}
        mentionedPersonLookup={async () => null}
        parentGoal={parentGoal}
        setParentGoal={() => {}}
        parentGoalSearch={mockParentGoalSearch}
        startedAt={startedAt}
        setStartedAt={() => {}}
        dueAt={dueAt}
        setDueAt={() => {}}
        resources={mockResources}
        onResourceAdd={() => {}}
        onResourceEdit={() => {}}
        onResourceRemove={() => {}}
        contributors={mockContributors}
        manageTeamLink="/projects/1/team"
        championSearch={searchPeopleFn}
        reviewerSearch={searchPeopleFn}
        newCheckInLink="#"
        checkIns={mockCheckIns}
        newDiscussionLink="#"
        discussions={[]}
        onProjectDelete={() => {}}
        canDelete={true}
      />
    );
  },
};
