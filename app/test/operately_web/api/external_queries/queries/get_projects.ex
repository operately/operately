defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetProjects do
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
    %{space_id: Paths.space_id(ctx.space)}
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.projects)
    assert Enum.any?(response.projects, fn project -> project.id == Paths.project_id(ctx.project) end)
  end
end
