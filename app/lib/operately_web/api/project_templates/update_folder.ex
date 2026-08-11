defmodule OperatelyWeb.Api.ProjectTemplates.UpdateFolder do
  use TurboConnect.Mutation
  alias Operately.ProjectTemplates.ResourceFolder
  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :folder_id, :id, null: false
    field :name, :string, null: false
  end

  outputs do
    field :folder, :project_template_resource_folder, null: false
  end

  def call(conn, inputs),
    do:
      conn
      |> Steps.start_transaction()
      |> Steps.ensure_feature_enabled()
      |> Steps.load_template(inputs.template_id)
      |> Steps.check_template_permissions(:can_edit)
      |> Steps.load_resource(:folder, ResourceFolder, inputs.folder_id)
      |> Steps.update_resource(:folder, ResourceFolder, Map.take(inputs, [:name]))
      |> Steps.commit()
      |> Steps.respond(fn c -> %{folder: Serializer.serialize(c.updated_resource)} end)
end
