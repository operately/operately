defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetMilestone do
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
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.milestone_id(ctx.milestone)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.milestone
    assert response.milestone.id == Paths.milestone_id(ctx.milestone)
    assert response.milestone.title == ctx.milestone.title
    assert response.milestone.status == to_string(ctx.milestone.status)
  end
end
