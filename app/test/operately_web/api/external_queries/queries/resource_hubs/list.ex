defmodule OperatelyWeb.Api.ExternalQueries.Queries.ResourceHubs.List do
  use Operately.Support.ExternalApi.QuerySpec
  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "resource_hubs/list"
  def setup(ctx), do: ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space)
  def inputs(ctx), do: %{space_id: Paths.space_id(ctx.space)}

  def assert(response, ctx) do
    assert [%{id: id, is_default: true}] = response.hubs
    assert id == Paths.resource_hub_id(ctx.hub.id)
  end
end
