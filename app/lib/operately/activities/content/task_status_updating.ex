defmodule Operately.Activities.Content.TaskStatusUpdating do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :milestone, Operately.Projects.Milestone
    belongs_to :task, Operately.Tasks.Task
    field :old_status, :string
    field :new_status, :string
    field :name, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :space_id, :project_id, :task_id, :old_status, :new_status, :name])
  end

  def build(params) do
    changeset(params)
  end
end
