defmodule OperatelyWeb.Api.ExternalMutations.Mutations.SpaceDiscussions.Publish do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "space_discussions/publish"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_messages_board(:messages_board, :space)
    |> Factory.add_draft_message(:draft_message, :messages_board)

  end

  @impl true
  def inputs(ctx) do
    %{
      id: Paths.message_id(ctx.draft_message)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.discussion.id
    refute Map.has_key?(response, :error)
  end
end
