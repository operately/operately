defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetDiscussions do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

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
    %{space_id: Paths.space_id(ctx.space)}
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.discussions)
    assert is_list(response.my_drafts)
    assert Enum.any?(response.discussions, fn discussion -> discussion.id == Paths.message_id(ctx.message) end)
  end
end
