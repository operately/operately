# Modifying the database schema

Operately uses PostgreSQL in combination with Ecto to manage the database schema. 
This document explains how to add new tables, modify the existing, and run migrations.

- [Adding a new table](#adding-a-new-table)
- [Modifying an existing table](#modifying-an-existing-table)

## Adding a new table

In most cases, when introducing a new database table, what you really want is to 
create a new Ecto context. For example, if you want to add a new table for storing
tasks, you would create a new context called `Tasks` and a new schema module called
`Tasks.Task`.

Here is how you can generate a new context, schema, database table, and migration.

First, jump into the development shell:

```bash
make dev.shell
```

Then, generate a new context and schema:

```bash
mix phx.gen.context Tasks Task tasks title:string description:text
```

This command will generate:

- A new context in `lib/operately/tasks.ex` called `Operately.Tasks`
- A new schema module in `lib/operately/tasks/task.ex` called `Operately.Tasks.Task`
- A new migration file in `priv/repo/migrations` that creates a new table called `tasks`
- A new test file in `test/operately/tasks/task_test.exs` for testing the tasks context and schema

Now, run the migration:

```bash
mix migrate
```

This will create the new table in the database.

Read more about [phx.gen.context](https://hexdocs.pm/phoenix/Mix.Tasks.Phx.Gen.Context.html) in the Phoenix documentation.

## Modifying an existing table

If you need to modify an existing table, you should create a new migration file.

```bash
mix gen.migration NAME=add_status_to_tasks
```

This will generate a new migration file in `priv/repo/migrations` that you can use to modify the table.

For example, to add a new column called `status` to the `tasks` table, you would write the following migration:

```elixir
defmodule Operately.Repo.Migrations.AddStatusToTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :status, :string
    end
  end
end
```

Now, run the migration:

```bash
mix migrate
```

This will apply the changes to the database.

Following this step, you should update the context and schema modules to reflect the new changes.
For example, you would add a new field to the `Operately.Tasks.Task` schema module:

```elixir
defmodule Operately.Tasks.Task do
  use Ecto.Schema

  schema "tasks" do
    field :title, :string
    field :description, :text
    field :status, :string                                  # <---- Add this line
  end

  def changeset(task, attrs) do
    task
    |> cast(attrs, [:title, :description, :status])         # <---- Add :status here
    |> validate_required([:title, :description, :status])   # <---- Add :status here if it's required
  end 
end
```
