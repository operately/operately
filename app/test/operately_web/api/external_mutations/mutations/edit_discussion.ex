defmodule OperatelyWeb.Api.ExternalMutations.Mutations.EditDiscussion do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "edit_discussion"

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
      id: Paths.message_id(ctx.message),
      body: rich_text_string("Updated content"),
      state: "published"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.discussion.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
