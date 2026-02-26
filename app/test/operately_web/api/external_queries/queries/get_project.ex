defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetProject do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.project_id(ctx.project)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.project
    assert response.project.id == Paths.project_id(ctx.project)
  end
end
