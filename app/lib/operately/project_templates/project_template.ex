defmodule Operately.ProjectTemplates.ProjectTemplate do
  def __api_typename__, do: "project_template"

  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.ProjectTemplates.{Milestone, Task}
  alias Operately.Tasks.{KanbanState, Status}

  schema "project_templates" do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :creator, Operately.People.Person
    belongs_to :source_project, Operately.Projects.Project

    has_one :access_context, through: [:space, :access_context]

    has_many :milestones, Milestone
    has_many :tasks, Task

    field :name, :string
    field :description, :map
    field :duration_days, :integer

    embeds_many :task_statuses, Status, on_replace: :delete
    field :milestones_ordering_state, {:array, :string}, default: Operately.Projects.OrderingState.initialize()
    field :tasks_kanban_state, :map, default: KanbanState.initialize()

    field :archived_at, :utc_datetime_usec

    field :milestone_count, :integer, virtual: true, default: 0
    field :task_count, :integer, virtual: true, default: 0
    field :permissions, :any, virtual: true

    timestamps()
    soft_delete()
    request_info()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(template, attrs) do
    template
    |> cast(attrs, [
      :company_id,
      :space_id,
      :creator_id,
      :source_project_id,
      :name,
      :description,
      :duration_days,
      :milestones_ordering_state,
      :tasks_kanban_state,
      :archived_at,
      :deleted_at
    ])
    |> cast_embed(:task_statuses)
    |> put_default_task_statuses()
    |> validate_required([:company_id, :space_id, :creator_id, :name])
    |> validate_number(:duration_days, greater_than_or_equal_to: 0)
    |> check_constraint(:duration_days, name: :project_templates_duration_days_non_negative)
  end

  def set_permissions(template, company_read_only \\ false) do
    permissions = Operately.ProjectTemplates.Permissions.calculate(template.request_info.access_level, company_read_only: company_read_only)
    permissions = if template.archived_at, do: Operately.Permissions.ReadOnly.view_only(permissions), else: permissions

    %{template | permissions: permissions}
  end

  defp put_default_task_statuses(%Ecto.Changeset{data: %__MODULE__{id: nil}} = changeset) do
    case get_field(changeset, :task_statuses) do
      statuses when statuses in [nil, []] -> put_embed(changeset, :task_statuses, Status.default_task_statuses())
      _statuses -> changeset
    end
  end

  defp put_default_task_statuses(changeset), do: changeset
end
