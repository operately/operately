defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetProjectContributor do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_contributor(:contributor, :project)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.project_contributor_id(ctx.contributor)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.contributor
    assert response.contributor.id == Paths.project_contributor_id(ctx.contributor)
  end
end
