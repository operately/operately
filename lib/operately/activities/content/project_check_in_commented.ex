defmodule Operately.Activities.Content.ProjectStatusUpdateCommented do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :string
    field :project_id, :string
    field :status_update_id, :string
    field :comment_id, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

  def build(params) do
    project_id = params["project_id"]
    project = Operately.Projects.get_project!(project_id)

    changeset(%{
      company_id: project.company_id,
      project_id: project.id,
      status_update_id: params["update_id"],
      comment_id: params["comment_id"]
    })
  end
end
