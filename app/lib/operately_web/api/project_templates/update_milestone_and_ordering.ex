defmodule OperatelyWeb.Api.ProjectTemplates.UpdateMilestoneAndOrdering do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :task_id, :id, null: false
    field :milestone_id, :id, null: true
    field :index, :integer, null: false
  end

  outputs do
    field :task, :project_template_task, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.load_task(inputs.task_id)
    |> Steps.update_task_milestone_and_ordering(inputs.milestone_id, inputs.index)
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{task: Serializer.serialize(changes.updated_task)} end)
  end
end
