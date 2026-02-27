defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetResourceHubLink do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_link(:link, :hub)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.link_id(ctx.link)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.link
    assert response.link.id == Paths.link_id(ctx.link)
  end
end
