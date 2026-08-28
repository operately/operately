defmodule OperatelyWeb.Api.ProjectTemplates.UpdatePerson do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :template_person_id, :id, null: false
    field? :person_id, :id, null: false
    field? :role, :project_template_person_role, null: false
    field? :responsibility, :string, null: true
    field? :access_level, :access_options_int, null: false
  end

  outputs do
    field :person, :project_template_person, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.load_template_person(inputs.template_person_id)
    |> Steps.update_person(Map.drop(inputs, [:template_id, :template_person_id]))
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{person: Serializer.serialize(changes.updated_template_person)} end)
  end
end
