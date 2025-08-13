defmodule Operately.Activities.Content.TaskMilestoneUpdating do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :task, Operately.Tasks.Task
    belongs_to :old_milestone, Operately.Projects.Milestone
    belongs_to :new_milestone, Operately.Projects.Milestone
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :project_id, :task_id, :old_milestone_id, :new_milestone_id])
    |> validate_required([:company_id, :space_id, :project_id, :task_id])
  end

  def build(params) do
    changeset(params)
  end
end
