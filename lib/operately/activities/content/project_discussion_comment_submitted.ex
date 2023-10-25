defmodule Operately.Activities.Content.ProjectDiscussionCommentSubmitted do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :binary_id
    field :project_id, :binary_id
    field :discussion_id, :binary_id
    field :comment_id, :binary_id
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

  def build(params) do
    project = Operately.Projects.get_project!(params["project_id"])

    changeset(%{
      company_id: project.company_id,
      project_id: project.id,
      discussion_id: params["update_id"],
      comment_id: params["comment_id"]
    })
  end
end
