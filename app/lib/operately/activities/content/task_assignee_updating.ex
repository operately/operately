defmodule Operately.Activities.Content.TaskAssigneeUpdating do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :milestone, Operately.Projects.Milestone
    belongs_to :task, Operately.Tasks.Task
    belongs_to :old_assignee, Operately.People.Person
    belongs_to :new_assignee, Operately.People.Person
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :project_id, :milestone_id, :task_id, :old_assignee_id, :new_assignee_id])
    |> validate_required([:company_id, :space_id, :project_id, :task_id])
  end

  def build(params) do
    changeset(params)
  end
end
