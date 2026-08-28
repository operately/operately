defmodule OperatelyWeb.Api.ProjectTemplates.CreateTask do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field? :milestone_id, :id, null: true
    field :name, :string, null: false
    field? :description, :json, null: true
    field? :priority, :string, null: true
    field? :size, :string, null: true
    field? :due_offset_days, :integer, null: true
    field? :reminders, list_of(:task_reminder), null: false
    field? :task_status, :task_status, null: false
    field? :assignee_ids, list_of(:id), null: false, default: []
  end

  outputs do
    field :task, :project_template_task, null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.load_template(inputs.template_id)
    |> Steps.check_template_permissions(:can_edit)
    |> Steps.create_task(task_attrs(inputs))
    |> Steps.update_task_assignees(inputs.assignee_ids)
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{task: Serializer.serialize(changes.task)} end)
  end

  defp task_attrs(inputs) do
    inputs
    |> Map.drop([:template_id, :assignee_ids])
    |> Map.put_new(:description, %{})
    |> rename_milestone_id()
  end

  defp rename_milestone_id(inputs) do
    if Map.has_key?(inputs, :milestone_id) do
      inputs |> Map.put(:project_template_milestone_id, inputs.milestone_id) |> Map.delete(:milestone_id)
    else
      inputs
    end
  end
end
