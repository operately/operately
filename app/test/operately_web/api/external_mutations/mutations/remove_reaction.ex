defmodule OperatelyWeb.Api.ExternalMutations.Mutations.RemoveReaction do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "remove_reaction"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_messages_board(:messages_board, :space)
    |> Factory.add_message(:message, :messages_board)
    |> Factory.add_reactions(:reaction, :message)
  end

  @impl true
  def inputs(ctx) do
    %{
      reaction_id: Operately.ShortUuid.encode!(ctx.reaction.id)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
