defmodule OperatelyWeb.Api.ProjectTemplates.UpdateTaskAssignees do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :task_id, :id, null: false
    field :assignee_ids, list_of(:id), null: false
  end

  outputs do
    field :assignments, list_of(:project_template_task_assignment), null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.load_task(inputs.task_id)
    |> Steps.update_task_assignees(inputs.assignee_ids)
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{assignments: Serializer.serialize(changes.task_assignments)} end)
  end
end
