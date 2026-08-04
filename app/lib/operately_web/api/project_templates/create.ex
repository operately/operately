defmodule OperatelyWeb.Api.ProjectTemplates.Create do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps

  inputs do
    field :space_id, :id, null: false
    field :name, :string, null: false
    field? :description, :json, null: true
    field? :duration_days, :integer, null: true
  end

  outputs do
    field :template, :project_template, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.ensure_feature_enabled()
    |> Steps.load_space(inputs.space_id)
    |> Steps.check_space_permissions(:can_edit)
    |> Steps.create_template(inputs)
    |> Steps.commit()
    |> Steps.respond(fn changes ->
      template = Repo.preload(changes.template, [:space, :creator])
      %{template: Serializer.serialize(template, level: :essential)}
    end)
  end
end
