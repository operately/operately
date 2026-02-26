defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetAssignmentsCount do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  @impl true
  def setup(ctx), do: Factory.setup(ctx)

  @impl true
  def assert(response, _ctx) do
    assert is_integer(response.count)
  end
end
