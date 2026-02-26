defmodule OperatelyWeb.Api.ExternalQueries.Queries.AiGetConversations do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  def query_name, do: "ai/get_conversations"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("ai")
  end

  @impl true
  def inputs(_ctx) do
    %{
      context_type: "goal",
      context_id: Ecto.UUID.generate() |> OperatelyWeb.Paths.goal_id()
    }
  end

  @impl true
  def assert(res, _ctx) do
    assert res["conversations"] == []
  end
end
