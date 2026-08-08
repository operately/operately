defmodule OperatelyWeb.Api.ProjectTemplates.CreateProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps

  inputs do
    field :template_id, :id, null: false
    field :space_id, :id, null: false
    field :start_date, :date, null: false
    field :name, :string, null: false
    field? :goal_id, :id, null: true
    field :anonymous_access_level, :access_options_int, null: false
    field :company_access_level, :access_options_int, null: false
    field :space_access_level, :access_options_int, null: false
  end

  outputs do
    field :project, :project, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.ensure_feature_enabled()
    |> Steps.load_space(inputs.space_id)
    |> Steps.check_space_permissions(:can_edit)
    |> Steps.load_template(inputs.template_id)
    |> Steps.ensure_template_belongs_to_space()
    |> Steps.create_project_from_template(inputs)
    |> Steps.commit()
    |> Steps.respond(fn changes ->
      %{project: Serializer.serialize(changes.project, level: :essential)}
    end)
  end
end
