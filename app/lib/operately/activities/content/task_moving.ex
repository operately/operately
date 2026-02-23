defmodule Operately.Activities.Content.TaskMoving do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :task, Operately.Tasks.Task

    # Destination context used for feed scope/context assignment.
    belongs_to :project, Operately.Projects.Project
    belongs_to :space, Operately.Groups.Group

    belongs_to :origin_project, Operately.Projects.Project
    belongs_to :origin_space, Operately.Groups.Group

    belongs_to :destination_project, Operately.Projects.Project
    belongs_to :destination_space, Operately.Groups.Group

    field :task_name, :string
    field :origin_type, :string
    field :destination_type, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([
      :company_id,
      :task_id,
      :space_id,
      :origin_space_id,
      :destination_space_id,
      :task_name,
      :origin_type,
      :destination_type
    ])
    |> validate_inclusion(:origin_type, ["project", "space"])
    |> validate_inclusion(:destination_type, ["project", "space"])
  end

  def build(params) do
    changeset(params)
  end
end
