defmodule OperatelyWeb.Api.ProjectTemplates.CreatePerson do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :person_id, :id, null: false
    field :role, :project_template_person_role, null: false
    field? :responsibility, :string, null: true
    field :access_level, :access_options_int, null: false
  end

  outputs do
    field :person, :project_template_person, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.ensure_feature_enabled()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.create_person(Map.delete(inputs, :template_id))
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{person: Serializer.serialize(changes.template_person)} end)
  end
end
