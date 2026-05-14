defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Spaces.CreateDiscussion do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Messages.Message
  alias Operately.Notifications.SubscriptionList

  @impl true
  def mutation_name, do: "spaces/create_discussion"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def inputs(ctx) do
    %{
      space_id: Paths.space_id(ctx.space),
      title: "Updated Title",
      body: rich_text_string("Updated content")
    }
  end

  @impl true
  def assert(response, _ctx) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(response.discussion.id)
    {:ok, message} = Message.get(:system, id: id)
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    assert response.discussion.id
    assert message.subscription_list_id
    assert list.send_to_everyone
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
