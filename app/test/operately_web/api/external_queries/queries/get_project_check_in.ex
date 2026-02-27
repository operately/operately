defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetProjectCheckIn do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_check_in(:check_in, :project, :creator)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.project_check_in_id(ctx.check_in)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.project_check_in
    assert response.project_check_in.id == Paths.project_check_in_id(ctx.check_in)
  end
end
