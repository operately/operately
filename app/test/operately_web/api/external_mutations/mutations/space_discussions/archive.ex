defmodule OperatelyWeb.Api.ExternalMutations.Mutations.SpaceDiscussions.Archive do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "space_discussions/archive"

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
    %{
      message_id: Paths.message_id(ctx.message)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_map(response)
    refute Map.has_key?(response, :error)
  end
end
