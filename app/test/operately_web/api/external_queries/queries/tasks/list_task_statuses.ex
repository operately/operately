defmodule OperatelyWeb.Api.ExternalQueries.Queries.Tasks.ListTaskStatuses do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "tasks/list_task_statuses"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
    |> Factory.add_project_task(:task, :milestone)
  end

  @impl true
  def inputs(ctx) do
    %{task_id: Paths.task_id(ctx.task)}
  end

  @impl true
  def assert(response, _ctx) do
    assert is_list(response.task_statuses)
    assert length(response.task_statuses) > 0
    assert Enum.any?(response.task_statuses, &(&1.value == "done"))
  end
end
