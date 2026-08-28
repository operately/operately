defmodule OperatelyWeb.Api.ProjectTemplates.CreateDocument do
  use TurboConnect.Mutation
  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field? :parent_folder_id, :id, null: true
    field :name, :string, null: false
    field :content, :json, null: false
  end

  outputs do
    field :document, :project_template_resource_document, null: false
  end

  def call(conn, inputs),
    do:
      conn
      |> Steps.start_transaction()
      |> Steps.load_template(inputs.template_id)
      |> Steps.check_template_permissions(:can_edit)
      |> Steps.create_resource(:document, Map.delete(inputs, :template_id))
      |> Steps.commit()
      |> Steps.respond(fn c -> %{document: Serializer.serialize(c.resource)} end)
end
