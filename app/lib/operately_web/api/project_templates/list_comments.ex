defmodule OperatelyWeb.Api.ProjectTemplates.ListComments do
  use TurboConnect.Query

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :parent_type, :project_template_comment_parent_type, null: false
    field :parent_id, :id, null: false
  end

  outputs do
    field :comments, list_of(:project_template_comment), null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.load_template_for_view(inputs.template_id)
    |> Steps.check_template_permissions(:can_view)
    |> Steps.load_comment_parent(inputs.parent_type, inputs.parent_id)
    |> Steps.list_comments(inputs.parent_type, inputs.parent_id)
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{comments: Serializer.serialize(changes.comments)} end)
  end
end
