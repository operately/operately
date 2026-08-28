defmodule OperatelyWeb.Api.ProjectTemplates.UpdateDiscussion do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :discussion_id, :id, null: false
    field :title, :string, null: false
    field :body, :json, null: false
  end

  outputs do
    field :discussion, :project_template_discussion, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.load_discussion(inputs.discussion_id)
    |> Steps.update_discussion(Map.drop(inputs, [:template_id, :discussion_id]))
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{discussion: Serializer.serialize(changes.updated_discussion)} end)
  end
end
