defmodule OperatelyWeb.Api.ProjectTemplates.UpdateDocument do
  use TurboConnect.Mutation
  alias Operately.ProjectTemplates.ResourceDocument
  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :document_id, :id, null: false
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
      |> Steps.ensure_feature_enabled()
      |> Steps.load_template(inputs.template_id)
      |> Steps.check_template_permissions(:can_edit)
      |> Steps.load_resource(:document, ResourceDocument, inputs.document_id)
      |> Steps.update_resource(:document, ResourceDocument, Map.take(inputs, [:name, :content]))
      |> Steps.commit()
      |> Steps.respond(fn c -> %{document: Serializer.serialize(c.updated_resource)} end)
end
