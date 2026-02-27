defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetResourceHub do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.resource_hub_id(ctx.hub)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.resource_hub
    assert response.resource_hub.id == Paths.resource_hub_id(ctx.hub)
  end
end
