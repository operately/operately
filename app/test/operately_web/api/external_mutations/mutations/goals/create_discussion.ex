defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Goals.CreateDiscussion do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Notifications.SubscriptionList

  @impl true
  def mutation_name, do: "goals/create_discussion"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  @impl true
  def inputs(ctx) do
    %{
      goal_id: Paths.goal_id(ctx.goal),
      title: "Updated Title",
      message: rich_text_string("Updated content")
    }
  end

  @impl true
  def assert(response, _ctx) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(response.discussion.id)
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    assert response.activity_id
    assert response.discussion
    assert list.send_to_everyone
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
