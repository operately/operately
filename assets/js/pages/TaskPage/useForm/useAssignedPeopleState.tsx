import * as React from "react";
import * as Tasks from "@/models/tasks";
import * as People from "@/models/people";

export interface AssignedPeopleState {
  people: People.Person[];
  add: (person: People.Person) => Promise<void>;
}

export function useAssignedPeopleState(task: Tasks.Task): AssignedPeopleState {
  const [people, setPeople] = React.useState(
    task.assignees!.slice().sort((a, b) => a.fullName.localeCompare(b.fullName)),
  );

  const [addPerson] = Tasks.useAssignPersonToTaskMutation({});

  const add = React.useCallback(
    async (person: People.Person) => {
      await addPerson({
        variables: {
          input: {
            taskId: task.id,
            personId: person.id,
          },
        },
      });

      setPeople((people) => [...people, person].sort((a, b) => a.fullName.localeCompare(b.fullName)));
    },
    [addPerson, task.id],
  );

  return {
    people,
    add,
  };
}
