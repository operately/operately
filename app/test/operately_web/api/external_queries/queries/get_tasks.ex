defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetTasks do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

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
    %{milestone_id: Paths.milestone_id(ctx.milestone)}
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.tasks)
    assert Enum.any?(response.tasks, fn task -> task.id == Paths.task_id(ctx.task) end)
  end
end
