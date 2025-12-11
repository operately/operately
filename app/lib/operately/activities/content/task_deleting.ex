defmodule Operately.Activities.Content.TaskDeleting do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :milestone, Operately.Projects.Milestone
    belongs_to :task, Operately.Tasks.Task

    field :name, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :space_id, :task_id, :name])
  end

  def build(params) do
    changeset(params)
  end
end
