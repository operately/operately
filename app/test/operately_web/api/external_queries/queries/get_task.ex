defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetTask do
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
    %{id: Paths.task_id(ctx.task)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.task
    assert response.task.id == Paths.task_id(ctx.task)
  end
end
