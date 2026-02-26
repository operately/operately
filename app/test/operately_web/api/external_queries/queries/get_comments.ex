defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetComments do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query :get_comments do
    setup &setup_comments/1
    inputs &get_comments_inputs/1
    assert &assert_get_comments/2
  end

  def setup_discussion(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_messages_board(:messages_board, :space)
    |> Factory.add_message(:message, :messages_board)
  end

  def setup_comments(ctx) do
    ctx
    |> setup_discussion()
    |> Factory.preload(:message, :space)
    |> Factory.add_comment(:comment, :message)
  end

  def get_comments_inputs(ctx) do
    %{
      entity_id: Paths.message_id(ctx.message),
      entity_type: "message"
    }
  end

  def assert_get_comments(response, ctx) do
    assert is_list(response.comments)
    assert Enum.any?(response.comments, fn comment -> comment.id == Paths.comment_id(ctx.comment) end)
  end
end
