defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetSpaces do
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
  def assert(response, ctx) do
    assert is_list(response.spaces)
    assert Enum.any?(response.spaces, fn space -> space.id == Paths.space_id(ctx.space) end)
  end
end
