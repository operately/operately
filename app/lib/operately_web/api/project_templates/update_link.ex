defmodule OperatelyWeb.Api.ProjectTemplates.UpdateLink do
  use TurboConnect.Mutation
  alias Operately.ProjectTemplates.ResourceLink
  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :link_id, :id, null: false
    field :name, :string, null: false
    field :url, :string, null: false
    field? :description, :json, null: true
    field :type, :project_template_resource_link_type, null: false
  end

  outputs do
    field :link, :project_template_resource_link, null: false
  end

  def call(conn, inputs),
    do:
      conn
      |> Steps.start_transaction()
      |> Steps.load_template(inputs.template_id)
      |> Steps.check_template_permissions(:can_edit)
      |> Steps.load_resource(:link, ResourceLink, inputs.link_id)
      |> Steps.update_resource(:link, ResourceLink, Map.take(inputs, [:name, :url, :description, :type]))
      |> Steps.commit()
      |> Steps.respond(fn c -> %{link: Serializer.serialize(c.updated_resource)} end)
end
