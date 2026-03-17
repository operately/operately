defmodule OperatelyWeb.Api.ExternalQueries.Queries.Notifications.GetUnreadCount do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  def query_name, do: "notifications/get_unread_count"

  @impl true
  def setup(ctx), do: Factory.setup(ctx)

  @impl true
  def assert(response, _ctx) do
    assert is_integer(response.unread)
  end
end
