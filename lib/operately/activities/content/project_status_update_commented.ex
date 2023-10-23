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

  def build(context, comment) do
    update = context.update
    project = Operately.Projects.get_project!(update.updatable_id)

    changeset(%{
      company_id: project.company_id,
      project_id: project.id,
      status_update_id: comment.update_id,
      comment_id: comment.id
    })
  end
end
