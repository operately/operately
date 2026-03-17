defmodule OperatelyWeb.Api.ExternalQueries.Queries.Companies.GetWorkMap do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  def query_name, do: "companies/get_work_map"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  @impl true
  def assert(response, _ctx) do
    assert is_list(response.work_map)
  end
end
