defmodule Operately.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "projects" do
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id
    belongs_to :objective, Operately.Okrs.Objective, foreign_key: :objective_id

    has_many :contributors, Operately.Projects.Contributor, foreign_key: :project_id

    field :description, :map
    field :name, :string

    field :started_at, :utc_datetime
    field :deadline, :utc_datetime
    field :next_update_scheduled_at, :utc_datetime
    field :phase, Ecto.Enum, values: [:draft, :planning, :design, :execution, :closing, :closed], default: :draft

    timestamps()
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [
      :name,
      :description,
      :group_id,
      :started_at,
      :deadline,
      :objective_id,
      :next_update_scheduled_at,
      :phase
    ])
    |> validate_required([:name])
  end
end
