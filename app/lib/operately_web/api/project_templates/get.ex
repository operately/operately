defmodule OperatelyWeb.Api.ProjectTemplates.Get do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 2]

  alias Operately.ProjectTemplates
  alias Operately.ProjectTemplates.{Milestone, ProjectTemplate, Task}

  inputs do
    field :id, :id, null: false
  end

  outputs do
    field :template, :project_template, null: false
  end

  def call(conn, inputs) do
    with {:ok, :enabled} <- ProjectTemplates.ensure_feature_enabled(company(conn)),
         {:ok, template} <- get_project_template(me(conn), inputs.id) do
      {:ok, %{template: Serializer.serialize(template, level: :full)}}
    end
  end

  defp get_project_template(requester, id) do
    with {:ok, template} <-
           ProjectTemplate.get(requester,
             id: id,
             company_id: requester.company_id,
             opts: [preload: [:space, :creator, milestones: milestones_query(), tasks: tasks_query()]]
           ) do
      {:ok, %{template | milestone_count: length(template.milestones), task_count: length(template.tasks)}}
    end
  end

  defp milestones_query do
    from(milestone in Milestone, order_by: [asc: milestone.inserted_at, asc: milestone.id])
  end

  defp tasks_query do
    from(task in Task, order_by: [asc: task.inserted_at, asc: task.id])
  end
end
