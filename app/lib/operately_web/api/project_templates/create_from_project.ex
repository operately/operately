defmodule OperatelyWeb.Api.ProjectTemplates.CreateFromProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.ProjectTemplates.SharedSteps, as: Steps
  alias OperatelyWeb.Paths

  inputs do
    field :project_id, :id, null: false
    field :name, :string, null: false
    field? :description, :json, null: true
    field? :include_people_and_assignments, :boolean, null: false, default: false
    field? :include_discussions, :boolean, null: false, default: true
    field? :include_docs_and_files, :boolean, null: false, default: true
  end

  outputs do
    field? :template, :project_template, null: true
    field :schedule_issues, list_of(:project_template_schedule_issue), null: false
  end

  def call(conn, inputs) do
    conn
    |> Steps.start_transaction()
    |> Steps.ensure_feature_enabled()
    |> Steps.load_project(inputs.project_id)
    |> Steps.load_project_space()
    |> Steps.check_space_permissions(:can_edit)
    |> Steps.commit()
    |> Steps.create_template_from_project(inputs)
    |> Steps.respond(&serialize_result/1)
  end

  defp serialize_result(%{template_creation: %{template: nil, schedule_issues: issues}}) do
    %{template: nil, schedule_issues: Enum.map(issues, &serialize_issue/1)}
  end

  defp serialize_result(%{template_creation: %{template: template, schedule_issues: []}}) do
    template = Repo.preload(template, [:space, :creator])
    %{template: Serializer.serialize(template, level: :essential), schedule_issues: []}
  end

  defp serialize_issue(issue), do: Map.put(issue, :resource_id, resource_id(issue))

  defp resource_id(%{resource_type: :project, resource_id: id, resource_name: name}), do: Paths.project_id(%{id: id, name: name})
  defp resource_id(%{resource_type: :milestone, resource_id: id, resource_name: name}), do: Paths.milestone_id(id, name)
  defp resource_id(%{resource_type: :task, resource_id: id, resource_name: name}), do: Paths.task_id(%{id: id, name: name})
end
