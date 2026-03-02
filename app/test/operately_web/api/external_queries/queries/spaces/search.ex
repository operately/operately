defmodule OperatelyWeb.Api.ExternalQueries.Queries.Spaces.Search do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  def query_name, do: "spaces/search"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def inputs(_ctx) do
    %{query: ""}
  end

  @impl true
  def assert(res, _ctx) do
    assert length(res.spaces) > 0
  end
end
