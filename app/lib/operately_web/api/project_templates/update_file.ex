defmodule OperatelyWeb.Api.ProjectTemplates.UpdateFile do
  use TurboConnect.Mutation
  alias Operately.ProjectTemplates.ResourceFile
  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :file_id, :id, null: false
    field :name, :string, null: false
    field? :description, :json, null: true
  end

  outputs do
    field :file, :project_template_resource_file, null: false
  end

  def call(conn, inputs),
    do:
      conn
      |> Steps.start_transaction()
      |> Steps.load_template(inputs.template_id)
      |> Steps.check_template_permissions(:can_edit)
      |> Steps.load_resource(:file, ResourceFile, inputs.file_id)
      |> Steps.update_resource(:file, ResourceFile, Map.take(inputs, [:name, :description]))
      |> Steps.commit()
      |> Steps.respond(fn c -> %{file: Serializer.serialize(c.updated_resource)} end)
end
