defmodule OperatelyWeb.Api.ExternalQueries.Queries.AiGetConversationMessages do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  def query_name, do: "ai/get_conversation_messages"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.enable_feature("ai")
  end

  @impl true
  def inputs(_ctx) do
    %{}
  end

  @impl true
  def assert(res, _ctx) do
    assert res["messages"]
  end
end
