defmodule OperatelyWeb.Api.ProjectTemplates.CreateDiscussion do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :title, :string, null: false
    field :body, :json, null: false
  end

  outputs do
    field :discussion, :project_template_discussion, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.ensure_feature_enabled()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.create_discussion(Map.drop(inputs, [:template_id]))
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{discussion: Serializer.serialize(changes.discussion)} end)
  end
end
