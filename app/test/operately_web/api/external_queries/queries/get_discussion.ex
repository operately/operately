defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetDiscussion do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query :get_discussion do
    setup &setup_discussion/1
    inputs &get_discussion_inputs/1
    assert &assert_get_discussion/2
  end

  def setup_discussion(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_messages_board(:messages_board, :space)
    |> Factory.add_message(:message, :messages_board)
  end

  def get_discussion_inputs(ctx) do
    %{id: Paths.message_id(ctx.message)}
  end

  def assert_get_discussion(response, _ctx) do
    assert response.discussion
    assert response.discussion.title
    assert response.discussion.body
  end
end
