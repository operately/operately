defmodule OperatelyWeb.Api.ProjectTemplates.GetDiscussion do
  use TurboConnect.Query

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :discussion_id, :id, null: false
  end

  outputs do
    field :discussion, :project_template_discussion, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.ensure_feature_enabled()
    |> Steps.load_template_for_view(inputs.template_id)
    |> Steps.check_template_permissions(:can_view)
    |> Steps.load_discussion(inputs.discussion_id)
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{discussion: Serializer.serialize(changes.discussion)} end)
  end
end
