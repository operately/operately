defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Goals.Close do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "goals/close"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_company_member(:member)
  end

  @impl true
  def inputs(ctx) do
    %{
      goal_id: Paths.goal_id(ctx.goal),
      success: "yes",
      retrospective: rich_text_string("Updated content"),
      success_status: "achieved",
      send_notifications_to_everyone: false,
      subscriber_ids: [Paths.person_id(ctx.member)]
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.goal.id == Paths.goal_id(ctx.goal)
    refute Map.has_key?(response, :error)
  end

  defp rich_text_string(text), do: Operately.Support.RichText.rich_text(text, :as_string)
end
