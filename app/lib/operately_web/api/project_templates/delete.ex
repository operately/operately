defmodule OperatelyWeb.Api.ProjectTemplates.Delete do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps

  inputs do
    field :id, :id, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.load_template_for_view(inputs.id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.delete_template()
    |> Steps.commit()
    |> Steps.respond(fn _changes -> %{success: true} end)
  end
end
