defmodule OperatelyWeb.Api.ExternalQueries.Queries.Spaces.CountByAccessLevel do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  def query_name, do: "spaces/count_by_access_level"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def inputs(_ctx) do
    %{access_level: "view_access"}
  end

  @impl true
  def assert(res, _ctx) do
    assert is_integer(res.count)
  end
end
