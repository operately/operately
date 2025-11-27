defmodule Operately.Activities.Content.TaskStatusUpdating do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :milestone, Operately.Projects.Milestone
    belongs_to :task, Operately.Tasks.Task

    embeds_one :old_status, Operately.Projects.TaskStatus
    embeds_one :new_status, Operately.Projects.TaskStatus

    field :name, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :project_id, :milestone_id, :task_id, :name])
    |> cast_embed(:old_status, required: true)
    |> cast_embed(:new_status, required: true)
    |> validate_required([:company_id, :space_id, :project_id, :task_id, :name])
  end

  def build(params) do
    changeset(params)
  end
end
