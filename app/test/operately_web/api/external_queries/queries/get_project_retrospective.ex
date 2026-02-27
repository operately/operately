defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetProjectRetrospective do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "get_project_retrospective"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:author)
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_retrospective(:retrospective, :project, :author)
  end

  @impl true
  def inputs(ctx) do
    %{project_id: Paths.project_id(ctx.project)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.retrospective
    assert response.retrospective.id == Paths.project_retrospective_id(ctx.retrospective)
  end
end
