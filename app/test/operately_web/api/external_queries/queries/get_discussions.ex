defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetDiscussions do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query :get_discussions do
    setup &setup_discussion/1
    inputs &get_discussions_inputs/1
    assert &assert_get_discussions/2
  end

  def setup_discussion(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_messages_board(:messages_board, :space)
    |> Factory.add_message(:message, :messages_board)
  end

  def get_discussions_inputs(ctx) do
    %{space_id: Paths.space_id(ctx.space)}
  end

  def assert_get_discussions(response, ctx) do
    assert is_list(response.discussions)
    assert is_list(response.my_drafts)
    assert Enum.any?(response.discussions, fn discussion -> discussion.id == Paths.message_id(ctx.message) end)
  end
end
