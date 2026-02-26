defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetKeyResource do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> add_key_resource()
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.key_resource_id(ctx.key_resource)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.key_resource
    assert response.key_resource.id == Paths.key_resource_id(ctx.key_resource)
    assert response.key_resource.project_id == Paths.project_id(ctx.project)
  end

  defp add_key_resource(ctx) do
    key_resource = Operately.ProjectsFixtures.key_resource_fixture(%{project_id: ctx.project.id})
    Map.put(ctx, :key_resource, key_resource)
  end
end
