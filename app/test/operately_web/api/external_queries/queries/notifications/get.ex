defmodule OperatelyWeb.Api.ExternalQueries.Queries.Notifications.Get do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  def query_name, do: "notifications/get"

  @impl true
  def setup(ctx), do: Factory.setup(ctx)

  @impl true
  def assert(response, _ctx) do
    assert is_list(response.notifications)
  end
end
