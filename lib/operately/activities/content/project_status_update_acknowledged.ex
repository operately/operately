defmodule Operately.Activities.Content.ProjectStatusUpdateAcknowledged do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :string
    field :project_id, :string
    field :status_update_id, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

  def build(_context, status_update) do
    project_id = status_update.updatable_id
    project = Operately.Projects.get_project!(project_id)

    changeset(%{
      company_id: project.company_id,
      project_id: project.id,
      status_update_id: status_update.id,
    })
  end
end
