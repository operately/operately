defmodule Operately.Activities.Content.TaskArchiveUpdating do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :task, Operately.Tasks.Task
    field :name, :string
    field :archived, :boolean
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :project_id, :task_id, :name, :archived])
    |> validate_required([:company_id, :space_id, :task_id, :name, :archived])
  end

  def build(attrs), do: changeset(attrs)
end
