defmodule OperatelyWeb.Api.ProjectTemplates.Get do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 2]

  alias Operately.ProjectTemplates
  alias Operately.ProjectTemplates.{Discussion, Milestone, People, ProjectTemplate, Task}

  inputs do
    field :id, :id, null: false
  end

  outputs do
    field :template, :project_template, null: false
  end

  def call(conn, inputs) do
    with {:ok, :enabled} <- ProjectTemplates.ensure_feature_enabled(company(conn)),
         {:ok, template} <- get_project_template(me(conn), inputs.id, company_read_only(conn)) do
      {:ok, %{template: Serializer.serialize(template, level: :full)}}
    end
  end

  defp get_project_template(requester, id, company_read_only) do
    with {:ok, template} <-
           ProjectTemplate.get(requester,
             id: id,
             company_id: requester.company_id,
             opts: [
               preload: [
                 :space,
                 :creator,
                 people: [:person, :project_template],
                 task_assignments: [],
                 discussions: discussions_query(),
                 milestones: milestones_query(),
                 tasks: tasks_query()
               ],
               after_load: [&ProjectTemplate.set_permissions(&1, company_read_only)]
             ]
           ) do
      template = %{template | milestone_count: length(template.milestones), task_count: length(template.tasks)}
      {:ok, template |> List.wrap() |> People.put_inactive_summaries() |> Discussion.put_inactive_counts() |> List.first()}
    end
  end

  defp milestones_query do
    from(milestone in Milestone, order_by: [asc: milestone.inserted_at, asc: milestone.id])
  end

  defp tasks_query do
    from(task in Task, order_by: [asc: task.inserted_at, asc: task.id])
  end

  defp discussions_query do
    from(discussion in Discussion, order_by: [asc: discussion.position, asc: discussion.id], preload: [:author])
  end
end
