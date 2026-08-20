defmodule Operately.ProjectTemplates.Milestone do
  def __api_typename__, do: "project_template_milestone"

  use Operately.Schema

  alias Operately.ProjectTemplates.{ProjectTemplate, Task}
  alias Operately.Tasks.OrderingState

  schema "project_template_milestones" do
    belongs_to :project_template, ProjectTemplate
    has_many :tasks, Task, foreign_key: :project_template_milestone_id

    field :title, :string
    field :description, :map
    field :due_offset_days, :integer
    field :tasks_ordering_state, {:array, :string}, default: OrderingState.initialize()

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(milestone, attrs) do
    milestone
    |> cast(attrs, [
      :project_template_id,
      :title,
      :description,
      :due_offset_days,
      :tasks_ordering_state
    ])
    |> validate_required([:project_template_id, :title])
    |> validate_number(:due_offset_days, greater_than_or_equal_to: 0)
    |> check_constraint(:due_offset_days, name: :project_template_milestones_due_offset_days_non_negative)
  end
end
