defmodule OperatelyWeb.Api.ProjectTemplates.CreateFiles do
  use TurboConnect.Mutation
  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field? :parent_folder_id, :id, null: true
    field :files, list_of(:project_template_uploaded_file), null: false
  end

  outputs do
    field :files, list_of(:project_template_resource_file), null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.create_files(inputs[:parent_folder_id], inputs.files)
    |> Steps.commit()
    |> Steps.respond(fn c -> %{files: Serializer.serialize(c.files)} end)
  end
end
