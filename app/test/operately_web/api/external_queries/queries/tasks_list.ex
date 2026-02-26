defmodule OperatelyWeb.Api.ExternalQueries.Queries.TasksList do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "tasks/list"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_milestone(:milestone, :project)
  end

  @impl true
  def inputs(ctx) do
    %{milestone_id: Paths.milestone_id(ctx.milestone), status: "todo"}
  end

  @impl true
  def assert(res, _ctx) do
    assert res["tasks"]
  end
end
