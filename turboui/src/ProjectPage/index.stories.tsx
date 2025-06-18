import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { ProjectPage } from "./index";
import { genPeople } from "../utils/storybook/genPeople";
import { mockTasks, mockEmptyTasks } from "../TaskBoard/tests/mockData";
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
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
  return mockPeople.filter(person => 
    person.fullName.toLowerCase().includes(query.toLowerCase())
  );
};

export const Default: Story = {
  render: () => {
    const [tasks, setTasks] = useState([...mockTasks]);
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
      
      // Create helper task to make milestone visible
      const helperTask = {
        id: `task-helper-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: `Hidden helper task for ${newMilestone.name}`,
        status: "pending" as TaskBoardTypes.Status,
        milestone: newMilestone,
        _isHelperTask: true,
      };
      setTasks([...tasks, helperTask]);
    };

    const handleTaskUpdate = (taskId: string, updates: Partial<TaskBoardTypes.Task>) => {
      console.log("Task updated:", taskId, updates);
      const updatedTasks = tasks.map((task) => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      setTasks(updatedTasks);
    };

    const handleMilestoneUpdate = (milestoneId: string, updates: Partial<TaskBoardTypes.Milestone>) => {
      console.log("Milestone updated:", milestoneId, updates);
      const updatedTasks = tasks.map(task => {
        if (task.milestone?.id === milestoneId) {
          return {
            ...task,
            milestone: { ...task.milestone, ...updates }
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
      
      const helperTask = {
        id: `task-helper-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: `Hidden helper task for ${newMilestone.name}`,
        status: "pending" as TaskBoardTypes.Status,
        milestone: newMilestone,
        _isHelperTask: true,
      };
      setTasks([...tasks, helperTask]);
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
