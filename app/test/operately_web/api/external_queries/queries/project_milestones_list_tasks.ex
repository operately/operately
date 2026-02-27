defmodule OperatelyWeb.Api.ExternalQueries.Queries.ProjectMilestonesListTasks do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "project_milestones/list_tasks"

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
    %{milestone_id: Paths.milestone_id(ctx.milestone)}
  end

  @impl true
  def assert(res, _ctx) do
    assert is_list(res.tasks)
  end
end
