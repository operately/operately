defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetComments do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> setup_discussion()
    |> Factory.preload(:message, :space)
    |> Factory.add_comment(:comment, :message)
  end

  @impl true
  def inputs(ctx) do
    %{
      entity_id: Paths.message_id(ctx.message),
      entity_type: "message"
    }
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.comments)
    assert Enum.any?(response.comments, fn comment -> comment.id == Paths.comment_id(ctx.comment) end)
  end

  defp setup_discussion(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_messages_board(:messages_board, :space)
    |> Factory.add_message(:message, :messages_board)
  end
end
