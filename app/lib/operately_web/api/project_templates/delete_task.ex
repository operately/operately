defmodule OperatelyWeb.Api.ProjectTemplates.DeleteTask do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps

  inputs do
    field :template_id, :id, null: false
    field :task_id, :id, null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.ensure_feature_enabled()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.load_task(inputs.task_id)
    |> Steps.delete_task()
    |> Steps.commit()
    |> Steps.respond(fn _changes -> %{success: true} end)
  end
end
