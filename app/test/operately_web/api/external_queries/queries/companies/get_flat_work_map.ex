defmodule OperatelyWeb.Api.ExternalQueries.Queries.Companies.GetFlatWorkMap do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  def query_name, do: "companies/get_flat_work_map"

  @impl true
  def setup(ctx), do: Factory.setup(ctx)

  @impl true
  def assert(response, _ctx) do
    assert response.work_map == []
  end
end
