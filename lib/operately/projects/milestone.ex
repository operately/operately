defmodule Operately.Projects.Milestone do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "project_milestones" do
    belongs_to :project, Operately.Projects.Project

    field :deadline_at, :naive_datetime
    field :title, :string
    field :status, Ecto.Enum, values: [:pending, :done], default: :pending

    timestamps()
  end

  @doc false
  def changeset(milestone, attrs) do
    milestone
    |> cast(attrs, [:title, :deadline_at, :project_id, :status])
    |> validate_required([:title])
  end
end
