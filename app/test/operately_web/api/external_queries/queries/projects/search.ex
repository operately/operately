defmodule OperatelyWeb.Api.ExternalQueries.Queries.Projects.Search do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  def query_name, do: "projects/search"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def inputs(_ctx) do
    %{query: "test"}
  end

  @impl true
  def assert(res, _ctx) do
    assert is_list(res.projects)
  end
end
