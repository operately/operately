defmodule OperatelyWeb.Api.ProjectTemplates.UpdateMilestone do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :milestone_id, :id, null: false
    field? :title, :string, null: false
    field? :description, :json, null: true
    field? :due_offset_days, :integer, null: true
    field? :tasks_ordering_state, list_of(:string), null: false
  end

  outputs do
    field :milestone, :project_template_milestone, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.ensure_feature_enabled()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.load_milestone(inputs.milestone_id)
    |> Steps.update_milestone(Map.drop(inputs, [:template_id, :milestone_id]))
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{milestone: Serializer.serialize(changes.updated_milestone)} end)
  end
end
