defmodule OperatelyWeb.Api.ProjectTemplates.MoveResource do
  use TurboConnect.Mutation
  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps

  inputs do
    field :template_id, :id, null: false
    field :node_id, :id, null: false
    field? :parent_folder_id, :id, null: true
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs),
    do:
      conn
      |> Steps.start_transaction()
      |> Steps.ensure_feature_enabled()
      |> Steps.load_template(inputs.template_id)
      |> Steps.check_template_permissions(:can_edit)
      |> Steps.load_resource_node(inputs.node_id)
      |> Steps.move_resource(Map.take(inputs, [:parent_folder_id]))
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
end
