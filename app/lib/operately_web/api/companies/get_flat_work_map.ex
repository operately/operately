defmodule OperatelyWeb.Api.Companies.GetFlatWorkMap do
  @moduledoc """
  Retrieves the company's work map without hierarchy.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.WorkMaps.GetWorkMapQuery
  alias Operately.Tasks.Task

  inputs do
    field? :space_id, :id, null: true
    field? :parent_goal_id, :id, null: true
    field? :champion_id, :id, null: true
    field? :reviewer_id, :id, null: true
    field? :contributor_id, :id, null: true
    field? :only_completed, :boolean, null: true
    field? :include_assignees, :boolean, null: true
    field? :include_reviewer, :boolean, null: true
    field? :include_tasks, :boolean, null: true
  end

  outputs do
    field :work_map, list_of(:work_map_item), null: false
  end

  def call(conn, inputs) do
    person = me(conn)
    company = company(conn)

    {:ok, flat_work_map} =
      GetWorkMapQuery.execute(person, %{
        company_id: company.id,
        space_id: inputs[:space_id],
        parent_goal_id: inputs[:parent_goal_id],
        champion_id: inputs[:champion_id],
        reviewer_id: inputs[:reviewer_id],
        contributor_id: inputs[:contributor_id],
        only_completed: inputs[:only_completed] || false,
        include_assignees: inputs[:include_assignees] || false,
        include_reviewer: inputs[:include_reviewer] || false,
        include_tasks: inputs[:include_tasks] || false,
        include_task_statuses: inputs[:include_tasks] || false
      }, :flat)

    work_map = Enum.map(flat_work_map, &load_task_permissions(&1, company_read_only(conn)))

    {:ok, %{work_map: Serializer.serialize(work_map)}}
  end

  defp load_task_permissions(%{type: :task, resource: task} = item, read_only) do
    %{item | resource: Task.set_permissions(task, read_only)}
  end

  defp load_task_permissions(item, _read_only), do: item
end
