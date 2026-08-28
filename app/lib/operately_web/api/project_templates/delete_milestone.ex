defmodule OperatelyWeb.Api.ProjectTemplates.DeleteMilestone do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps

  inputs do
    field :template_id, :id, null: false
    field :milestone_id, :id, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.load_milestone(inputs.milestone_id)
    |> Steps.delete_milestone()
    |> Steps.commit()
    |> Steps.respond(fn _changes -> %{success: true} end)
  end
end
