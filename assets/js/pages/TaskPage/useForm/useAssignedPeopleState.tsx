import * as React from "react";
import * as Tasks from "@/models/tasks";
import * as People from "@/models/people";

export interface AssignedPeopleState {
  people: People.Person[];
}

export function useAssignedPeopleState(task: Tasks.Task): AssignedPeopleState {
  const [people, setPeople] = React.useState(task.assignedPeople);

  return {
    people,
  };
}
