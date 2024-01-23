defmodule Operately.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset
  import Operately.SoftDelete.Schema

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "projects" do
    belongs_to :company, Operately.Companies.Company, foreign_key: :company_id
    belongs_to :creator, Operately.People.Person, foreign_key: :creator_id
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id
    belongs_to :goal, Operately.Goals.Goal, foreign_key: :goal_id

    has_many :contributors, Operately.Projects.Contributor, foreign_key: :project_id
    has_many :key_resources, Operately.Projects.KeyResource, foreign_key: :project_id
    has_many :phase_history, Operately.Projects.PhaseHistory, foreign_key: :project_id
    has_many :milestones, Operately.Projects.Milestone, foreign_key: :project_id

    field :description, :map
    field :name, :string
    field :private, :boolean, default: false

    field :started_at, :utc_datetime
    field :deadline, :utc_datetime
    field :next_update_scheduled_at, :utc_datetime
    field :phase, Ecto.Enum, values: [:concept, :planning, :execution, :control, :completed, :canceled, :paused], default: :planning
    field :health, Ecto.Enum, values: [:unknown, :on_track, :at_risk, :off_track, :paused], default: :unknown

    field :status, :string, default: "active"
    field :retrospective, :map
    field :closed_at, :utc_datetime

    timestamps()
    soft_delete()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(project, attrs) do
    project
    |> cast(attrs, [
      :name,
      :description,
      :group_id,
      :started_at,
      :deadline,
      :goal_id,
      :next_update_scheduled_at,
      :phase,
      :health,
      :company_id,
      :creator_id,
      :private,
      :deleted_at,
      :status,
      :retrospective,
      :closed_at,
    ])
    |> validate_required([
      :name,
      :company_id,
      :group_id,
      :creator_id,
    ])
  end
end
