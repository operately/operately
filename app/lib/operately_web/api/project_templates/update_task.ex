defmodule OperatelyWeb.Api.ProjectTemplates.UpdateTask do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :template_id, :id, null: false
    field :task_id, :id, null: false
    field? :milestone_id, :id, null: true
    field? :name, :string, null: false
    field? :description, :json, null: false
    field? :priority, :string, null: true
    field? :size, :string, null: true
    field? :due_offset_days, :integer, null: true
    field? :reminders, list_of(:task_reminder), null: false
    field? :task_status, :task_status, null: false
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
    |> Steps.update_task(task_attrs(inputs))
    |> Steps.commit()
    |> Steps.respond(fn changes -> %{task: Serializer.serialize(changes.updated_task)} end)
  end

  defp task_attrs(inputs) do
    inputs = Map.drop(inputs, [:template_id, :task_id])

    if Map.has_key?(inputs, :milestone_id) do
      inputs |> Map.put(:project_template_milestone_id, inputs.milestone_id) |> Map.delete(:milestone_id)
    else
      inputs
    end
  end
end
