defmodule Operately.Activities.Content.TaskDueDateUpdating do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :milestone, Operately.Projects.Milestone
    belongs_to :task, Operately.Tasks.Task

    field :task_name, :string
    embeds_one :old_due_date, Operately.ContextualDates.ContextualDate
    embeds_one :new_due_date, Operately.ContextualDates.ContextualDate
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :project_id, :milestone_id, :task_id, :task_name])
    |> cast_embed(:old_due_date)
    |> cast_embed(:new_due_date)
    |> validate_required([:company_id, :space_id, :task_id, :task_name])
  end

  def build(params) do
    changeset(params)
  end
end
