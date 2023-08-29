defmodule Operately.Projects.Milestone do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "project_milestones" do
    belongs_to :project, Operately.Projects.Project

    field :title, :string
    field :status, Ecto.Enum, values: [:pending, :done], default: :pending
    field :phase, Ecto.Enum, values: [:concept, :planning, :execution, :control], default: :concept

    field :deadline_at, :naive_datetime
    field :completed_at, :naive_datetime

    timestamps()
  end

  @doc false
  def changeset(milestone, attrs) do
    milestone
    |> cast(attrs, [:title, :deadline_at, :project_id, :status, :completed_at])
    |> validate_required([:title])
  end
end
