defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ReopenGoal do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "reopen_goal"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_company_member(:member)
    |> Factory.close_goal(:goal)
  end

  @impl true
  def inputs(ctx) do
    %{
      id: Paths.goal_id(ctx.goal),
      message: rich_text_string("Updated content"),
      send_notifications_to_everyone: false,
      subscriber_ids: [Paths.person_id(ctx.member)]
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.goal.id
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
