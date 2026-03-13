defmodule OperatelyWeb.Api.ExternalQueries.Queries.Spaces.List do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "spaces/list"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.spaces)
    assert Enum.any?(response.spaces, fn space -> space.id == Paths.space_id(ctx.space) end)
  end
end
