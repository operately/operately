defmodule Operately.Tasks.Assignee do
  use Operately.Schema

  schema "task_assignees" do
    belongs_to :task, Operately.Tasks.Task
    belongs_to :person, Operately.People.Person

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(assignee, attrs) do
    assignee
    |> cast(attrs, [])
    |> validate_required([])
  end
end
