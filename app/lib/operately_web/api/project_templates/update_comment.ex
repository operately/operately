defmodule OperatelyWeb.Api.ProjectTemplates.UpdateComment do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :comment_id, :id, null: false
    field :content, :json, null: false
  end

  outputs do
    field :comment, :project_template_comment, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.ensure_feature_enabled()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.load_comment(inputs.comment_id)
    |> Steps.update_comment(Map.take(inputs, [:content]))
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{comment: Serializer.serialize(changes.updated_comment)} end)
  end
end
