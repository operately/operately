defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetFlatWorkMap do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  @impl true
  def setup(ctx), do: Factory.setup(ctx)

  @impl true
  def assert(response, _ctx) do
    assert response.work_map == []
  end
end
