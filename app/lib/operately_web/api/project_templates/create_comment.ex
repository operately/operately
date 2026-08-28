defmodule OperatelyWeb.Api.ProjectTemplates.CreateComment do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :parent_type, :project_template_comment_parent_type, null: false
    field :parent_id, :id, null: false
    field :content, :json, null: false
  end

  outputs do
    field :comment, :project_template_comment, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.load_comment_parent(inputs.parent_type, inputs.parent_id)
    |> Steps.create_comment(Map.drop(inputs, [:template_id, :parent_id]))
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{comment: Serializer.serialize(changes.comment)} end)
  end
end
