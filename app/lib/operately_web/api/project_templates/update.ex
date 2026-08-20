defmodule OperatelyWeb.Api.ProjectTemplates.Update do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps

  inputs do
    field :id, :id, null: false
    field? :name, :string, null: false
    field? :description, :json, null: true
    field? :duration_days, :integer, null: true
    field? :task_statuses, list_of(:task_status), null: false
    field? :deleted_status_replacements, list_of(:deleted_status_replacement), null: false
    field? :milestones_ordering_state, list_of(:string), null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.ensure_feature_enabled()
    |> Steps.load_template(inputs.id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.update_template(Map.delete(inputs, :id))
    |> Steps.commit()
    |> Steps.respond(fn _changes -> %{success: true} end)
  end
end
