import * as React from "react";
import * as Tasks from "@/models/tasks";

export interface Fields {
  taskID: string;

  name: string;
  status: Tasks.Task["status"];
  description: Tasks.Task["description"];
  assignedPeople: Tasks.Task["assignees"];

  setName: (name: string) => void;
  setDescription: React.Dispatch<React.SetStateAction<Tasks.Task["description"]>>;
  setStatus: React.Dispatch<React.SetStateAction<Tasks.Task["status"]>>;
  setAssignedPeople: React.Dispatch<React.SetStateAction<Tasks.Task["assignees"]>>;
}

export function useFields(task: Tasks.Task): Fields {
  const [name, setName] = React.useState(task.name);
  const [status, setStatus] = React.useState(task.status);
  const [assignedPeople, setAssignedPeople] = React.useState(task.assignees!);
  const [description, setDescription] = React.useState(task.description);

  return {
    taskID: task.id,

    name,
    status,
    description,
    assignedPeople,

    setName,
    setStatus,
    setDescription,
    setAssignedPeople,
  };
}
