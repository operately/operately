import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { ProjectPage } from "./index";
import { genPeople } from "../utils/storybook/genPeople";
import { mockTasks, mockEmptyTasks, mockMilestones } from "../TaskBoard/tests/mockData";
import * as TaskBoardTypes from "../TaskBoard/types";

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

// Mock search function for people
const mockSearchPeople = async ({ query }: { query: string }): Promise<TaskBoardTypes.Person[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
  return mockPeople.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));
};

export const Default: Story = {
  render: () => {
    const [tasks, setTasks] = useState([...mockTasks]);
    const [milestones, setMilestones] = useState<TaskBoardTypes.Milestone[]>(Object.values(mockMilestones));
    const [filters, setFilters] = useState<TaskBoardTypes.FilterCondition[]>([]);

    const handleTaskStatusChange = (taskId: string, newStatus: TaskBoardTypes.Status) => {
      console.log("Task status change:", taskId, newStatus);
      const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task));
      setTasks(updatedTasks);
    };

    const handleTaskCreate = (newTaskData: Omit<TaskBoardTypes.Task, "id">) => {
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newTask = { id: taskId, ...newTaskData };
      console.log("Task created:", newTask);
      setTasks([...tasks, newTask]);
    };

    const handleMilestoneCreate = (newMilestoneData: Omit<TaskBoardTypes.Milestone, "id">) => {
      const milestoneId = `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newMilestone = { id: milestoneId, ...newMilestoneData };
      console.log("Milestone created:", newMilestone);

      // Add the new milestone to the milestones array
      setMilestones((prev) => [...prev, newMilestone]);
    };

    const handleTaskUpdate = (taskId: string, updates: Partial<TaskBoardTypes.Task>) => {
      console.log("Task updated:", taskId, updates);
      const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task));
      setTasks(updatedTasks);
    };

    const handleMilestoneUpdate = (milestoneId: string, updates: Partial<TaskBoardTypes.Milestone>) => {
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

    return (
      <ProjectPage
        closeLink="#"
        reopenLink="#"
        projectName="Mobile App Redesign"
        description="<p>Redesigning our mobile application to improve user experience and increase engagement. This project includes user research, wireframing, prototyping, and implementation.</p>"
        space={{ id: "1", name: "Product", link: "#" }}
        setSpace={() => {}}
        spaceSearch={async () => []}
        champion={people[0] || null}
        setChampion={() => {}}
        status="on_track"
        state="active"
        closedAt={null}
        canEdit={true}
        accessLevels={{ company: "edit", space: "view" }}
        setAccessLevels={() => {}}
        updateProjectName={async () => true}
        updateDescription={async () => true}
        activityFeed={<div>Activity feed content</div>}
        tasks={tasks}
        milestones={milestones}
        onTaskStatusChange={handleTaskStatusChange}
        onTaskCreate={handleTaskCreate}
        onMilestoneCreate={handleMilestoneCreate}
        onTaskUpdate={handleTaskUpdate}
        onMilestoneUpdate={handleMilestoneUpdate}
        searchPeople={mockSearchPeople}
        filters={filters}
        onFiltersChange={setFilters}
      />
    );
  },
};

export const ReadOnly: Story = {
  render: () => {
    const [tasks] = useState([...mockTasks]);
    const [milestones] = useState<TaskBoardTypes.Milestone[]>(Object.values(mockMilestones));

    return (
      <ProjectPage
        closeLink="#"
        reopenLink="#"
        projectName="Mobile App Redesign"
        description="<p>Redesigning our mobile application to improve user experience and increase engagement. This project includes user research, wireframing, prototyping, and implementation.</p>"
        space={{ id: "1", name: "Product", link: "#" }}
        setSpace={() => {}}
        spaceSearch={async () => []}
        champion={people[0] || null}
        setChampion={() => {}}
        status="on_track"
        state="active"
        closedAt={null}
        canEdit={false}
        accessLevels={{ company: "edit", space: "view" }}
        setAccessLevels={() => {}}
        updateProjectName={async () => true}
        updateDescription={async () => true}
        activityFeed={<div>Activity feed content</div>}
        tasks={tasks}
        milestones={milestones}
        onTaskStatusChange={() => {}}
        onTaskCreate={() => {}}
        onMilestoneCreate={() => {}}
        onTaskUpdate={() => {}}
        onMilestoneUpdate={() => {}}
        searchPeople={mockSearchPeople}
        filters={[]}
        onFiltersChange={() => {}}
      />
    );
  },
};

export const EmptyTasks: Story = {
  render: () => {
    const [tasks, setTasks] = useState([...mockEmptyTasks]);
    const [milestones, setMilestones] = useState<TaskBoardTypes.Milestone[]>([]);
    const [filters, setFilters] = useState<TaskBoardTypes.FilterCondition[]>([]);

    const handleTaskCreate = (newTaskData: Omit<TaskBoardTypes.Task, "id">) => {
      const taskId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newTask = { id: taskId, ...newTaskData };
      console.log("Task created:", newTask);
      setTasks([...tasks, newTask]);
    };

    const handleMilestoneCreate = (newMilestoneData: Omit<TaskBoardTypes.Milestone, "id">) => {
      const milestoneId = `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newMilestone = { id: milestoneId, ...newMilestoneData };
      console.log("Milestone created:", newMilestone);

      // Add the new milestone to the milestones array
      setMilestones((prev) => [...prev, newMilestone]);
    };

    return (
      <ProjectPage
        closeLink="#"
        reopenLink="#"
        projectName="Mobile App Redesign"
        description="<p>Redesigning our mobile application to improve user experience and increase engagement. This project includes user research, wireframing, prototyping, and implementation.</p>"
        space={{ id: "1", name: "Product", link: "#" }}
        setSpace={() => {}}
        spaceSearch={async () => []}
        champion={people[0] || null}
        setChampion={() => {}}
        status="on_track"
        state="active"
        closedAt={null}
        canEdit={true}
        accessLevels={{ company: "edit", space: "view" }}
        setAccessLevels={() => {}}
        updateProjectName={async () => true}
        updateDescription={async () => true}
        activityFeed={<div>Activity feed content</div>}
        tasks={tasks}
        milestones={milestones}
        onTaskStatusChange={() => {}}
        onTaskCreate={handleTaskCreate}
        onMilestoneCreate={handleMilestoneCreate}
        onTaskUpdate={() => {}}
        onMilestoneUpdate={() => {}}
        searchPeople={mockSearchPeople}
        filters={filters}
        onFiltersChange={setFilters}
      />
    );
  },
};

export const EmptyProject: Story = {
  render: () => {
    const [milestones, setMilestones] = useState<TaskBoardTypes.Milestone[]>([]);

    const handleMilestoneCreate = (newMilestoneData: Omit<TaskBoardTypes.Milestone, "id">) => {
      const milestoneId = `milestone-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newMilestone = { id: milestoneId, ...newMilestoneData };
      console.log("Milestone created:", newMilestone);

      // Add the new milestone to the milestones array
      setMilestones((prev) => [...prev, newMilestone]);
    };

    const handleMilestoneUpdate = (milestoneId: string, updates: Partial<TaskBoardTypes.Milestone>) => {
      console.log("Milestone updated:", milestoneId, updates);

      // Update the milestone in the milestones array
      const updatedMilestones = milestones.map((milestone) =>
        milestone.id === milestoneId ? { ...milestone, ...updates } : milestone,
      );
      setMilestones(updatedMilestones);
    };

    return (
      <ProjectPage
        closeLink="#"
        reopenLink="#"
        projectName="New Project"
        description={undefined}
        space={{ id: "1", name: "Product", link: "#" }}
        setSpace={() => {}}
        spaceSearch={async () => []}
        champion={null}
        setChampion={() => {}}
        status="on_track"
        state="active"
        closedAt={null}
        canEdit={true}
        accessLevels={{ company: "edit", space: "view" }}
        setAccessLevels={() => {}}
        updateProjectName={async () => true}
        updateDescription={async () => true}
        activityFeed={<div>Activity feed content</div>}
        tasks={[]}
        milestones={milestones}
        onTaskStatusChange={() => {}}
        onTaskCreate={() => {}}
        onMilestoneCreate={handleMilestoneCreate}
        onTaskUpdate={() => {}}
        onMilestoneUpdate={handleMilestoneUpdate}
        searchPeople={mockSearchPeople}
        filters={[]}
        onFiltersChange={() => {}}
        contributors={[]}
      />
    );
  },
};

export const EmptyProjectReadOnly: Story = {
  render: () => {
    const [tasks] = useState<TaskBoardTypes.Task[]>([]);
    const [milestones] = useState<TaskBoardTypes.Milestone[]>([]);

    return (
      <ProjectPage
        closeLink="#"
        reopenLink="#"
        projectName="Mobile App Redesign"
        description=""
        space={{ id: "1", name: "Product", link: "#" }}
        setSpace={() => {}}
        spaceSearch={async () => []}
        champion={null}
        setChampion={() => {}}
        status="on_track"
        state="active"
        closedAt={null}
        canEdit={false}
        accessLevels={{ company: "edit", space: "view" }}
        setAccessLevels={() => {}}
        updateProjectName={async () => true}
        updateDescription={async () => true}
        activityFeed={<div>Activity feed content</div>}
        tasks={tasks}
        milestones={milestones}
        onTaskStatusChange={() => {}}
        onTaskCreate={() => {}}
        onMilestoneCreate={() => {}}
        onTaskUpdate={() => {}}
        onMilestoneUpdate={() => {}}
        searchPeople={mockSearchPeople}
        filters={[]}
        onFiltersChange={() => {}}
        contributors={[]}
      />
    );
  },
};
