defmodule OperatelyWeb.Api.ExternalMutations.Mutations.DeleteComment do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "delete_comment"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_messages_board(:messages_board, :space)
    |> Factory.add_message(:message, :messages_board)
    |> Factory.preload(:message, :space)
    |> Factory.add_comment(:comment, :message)
  end

  @impl true
  def inputs(ctx) do
    %{
      comment_id: Paths.comment_id(ctx.comment),
      parent_type: "message"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.comment
    refute Map.has_key?(response, :error)
  end
end
