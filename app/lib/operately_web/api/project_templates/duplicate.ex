defmodule OperatelyWeb.Api.ProjectTemplates.Duplicate do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps

  inputs do
    field :id, :id, null: false
    field :name, :string, null: false
  end

  outputs do
    field :template, :project_template, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.load_template(inputs.id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.duplicate_template(inputs.name)
    |> Steps.commit()
    |> Steps.respond(fn changes ->
      template = Repo.preload(changes.duplicated_template, [:space, :creator])
      %{template: Serializer.serialize(template, level: :essential)}
    end)
  end
end
