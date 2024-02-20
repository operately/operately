defmodule Operately.Tasks.Task do
  use Operately.Schema

  schema "tasks" do
    belongs_to :creator, Operately.People.Person
    belongs_to :milestone, Operately.Projects.Milestone

    has_many :assignees, Operately.Tasks.Assignee

    field :name, :string
    field :priority, :string
    field :size, :string
    field :description, :map
    field :due_date, :naive_datetime

    field :status, :string, default: "todo" 
    field :closed_at, :naive_datetime
    field :reopened_at, :naive_datetime

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(task, attrs) do
    task
    |> cast(attrs, [:name, :due_date, :description, :size, :priority, :creator_id, :status, :closed_at, :reopened_at, :milestone_id])
    |> validate_required([:name, :description, :creator_id, :milestone_id])
  end
end
