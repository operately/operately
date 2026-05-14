defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Goals.CreateCheckIn do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Notifications.SubscriptionList

  @impl true
  def mutation_name, do: "goals/create_check_in"

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
      status: "on_track",
      due_date: nil,
      checklist: [],
      content: rich_text_string("Updated content"),
      new_target_values: "[]"
    }
  end

  @impl true
  def assert(response, _ctx) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(response.update.id)
    {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

    assert response.update.id
    assert list.send_to_everyone
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
