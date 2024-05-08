# API

Operately uses a GraphQL API to communicate between the client and the server.

- On the backend, the API is implemented with [Absinthe](https://absinthe-graphql.org/), a GraphQL toolkit for Elixir.
- On the frontend, the API is consumed with [Apollo Client](https://www.apollographql.com/docs/react/).

This document explains how to work with the API, including queries and mutations,
how to add new fields, and how to generate stubs for the frontend.

- [API Schema](#api-schema)
- [Types](#types)
- [Queries](#queries)
- [Mutations](#mutations)

## API Schema

The API is defined in the `OperatelyWeb.Schema` module, which is located in `lib/operately_web/schema.ex`.
This is an auto-generated file that contains the schema definition for the API, based on the
contents of the following files:

- `lib/operately_web/schema/types/*.ex` - Contains the GraphQL object types.
- `lib/operately_web/schema/queries/*.ex` - Contains the queries for fetching data via the API.
- `lib/operately_web/schema/mutations/*.ex` - Contains the mutations for modifying data via the API.

To regenerate the schema file, run the following command:

```bash
make gen
```

The `gen` task will run generate:

- `lib/operately_web/schema.ex` - The main schema file that imports all the types, queries, and mutations.
- `assets/js/gql/generated.tsx` - Stubs for the frontend to consume the API.

## Types

Types are used to define the structure of the data that is sent and received via the API.
For example, `OperatelyWeb.Schema.Types.Tasks` would contain the type definitions for tasks:

```elixir
defmodule OperatelyWeb.Schema.Types.Tasks do
  use Absinthe.Schema.Notation

  object :task do
    field :id, non_null(:id)
    field :title, non_null(:string)
    field :description, non_null(:string)
    field :status, non_null(:string)
    field :due_date, :date
  end
end
```

## Queries

Queries are used to fetch data from the server. They are defined in the `OperatelyWeb.Schema.Queries.*` modules.
For example `OperatelyWeb.Schema.Queries.Tasks` would contain queries for fetching tasks:

```elixir
defmodule OperatelyWeb.Schema.Queries.Tasks do
  use Absinthe.Schema.Notation

  query :task_queries do
    field :tasks, list_of(:task) do
      resolve fn _, _, _ ->
        {:ok, Operately.Tasks.list_tasks()}
      end
    end
  end
end
```

After regenerating the schema, you can use the `client.query({})` to fetch tasks on the frontend:

```typescript
import * as React from 'react';
import client from '@/graphql/client';

import { Task } from '@/gql/generated';

async function getTasks() : Promise<Task[]> {
  const { data } = await client.query({
    query: gql`
      query getTasks {
        tasks {
          id
          title
          description
          status
          dueDate
        }
      }
    `
  });

  return data.tasks;
}
```

## Mutations

Mutations are used to modify data on the server. They are defined in the `OperatelyWeb.Schema.Mutations.*` modules.
For example `OperatelyWeb.Schema.Mutations.Tasks` would contain mutations for creating, updating, and deleting tasks:

```elixir
defmodule OperatelyWeb.Schema.Mutations.Tasks do
  use Absinthe.Schema.Notation

  mutation :task_mutations do
    field :create_task, :task do
      arg :title, non_null(:string)
      arg :description, non_null(:string)
      arg :status, non_null(:string)
      arg :due_date, :date

      resolve fn _, args, _ ->
        {:ok, Operately.Tasks.create_task(args)}
      end
    end
  end
end
```

After regenerating the schema, you can use the `useCreateTaskMutation` hook on the frontend to create a new task:

```typescript
import * as React from 'react';
import client from '@/graphql/client';

import { useCreateTaskMutation } from '@/gql/generated';

function Form() {
  const [createTask] = useCreateTaskMutation();

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [dueDate, setDueDate] = React.useState(new Date());

  const handleSubmit = async (title: string, description: string, status: string, dueDate: Date) => {
    await createTask({
      variables: {
        title,
        description,
        status,
        dueDate
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Title</label>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />

      <label>Description</label>
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />

      <label>Status</label>
      <input type="text" value={status} onChange={(e) => setStatus(e.target.value)} />

      <label>Due Date</label>
      <input type="date" value={dueDate} onChange={(e) => setDueDate(new Date(e.target.value))} />

      <button type="submit">Submit</button>
    </form>
  );
}
```
