defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetSpace do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.space_id(ctx.space)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.space
    assert response.space.id == Paths.space_id(ctx.space)
  end
end
