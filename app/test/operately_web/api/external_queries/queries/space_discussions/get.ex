defmodule OperatelyWeb.Api.ExternalQueries.Queries.SpaceDiscussions.Get do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "space_discussions/get"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_messages_board(:messages_board, :space)
    |> Factory.add_message(:message, :messages_board)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.message_id(ctx.message)}
  end

  @impl true
  def assert(response, _ctx) do
    assert response.discussion
    assert response.discussion.title
    assert response.discussion.body
  end
end
