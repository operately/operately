defmodule OperatelyWeb.Api.ExternalQueries.Queries.Notifications.IsSubscribed do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "notifications/is_subscribed"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_goal_update(:goal_update, :goal, :creator)
  end

  @impl true
  def inputs(ctx) do
    %{
      resource_id: Paths.goal_update_id(ctx.goal_update),
      resource_type: "goal_update"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_boolean(response.subscribed)
  end
end
