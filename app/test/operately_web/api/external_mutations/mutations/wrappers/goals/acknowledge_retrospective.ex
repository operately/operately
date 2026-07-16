defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Wrappers.Goals.AcknowledgeRetrospective do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Support.RichText

  @impl true
  def mutation_name, do: "goals/acknowledge_retrospective"

  @impl true
  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:person, :space)
      |> Factory.add_goal(:goal, :space)

    {:ok, _} =
      Operately.Operations.GoalClosing.run(ctx.person, ctx.goal, %{
        success: "success",
        success_status: "achieved",
        content: RichText.rich_text("content"),
        send_notifications_to_everyone: false,
        subscriber_ids: [],
        subscription_parent_type: :comment_thread
      })

    Map.put(ctx, :activity, latest_goal_closing(ctx.goal))
  end

  @impl true
  def inputs(ctx) do
    %{
      goal_id: Paths.goal_id(ctx.goal)
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.activity.id == Paths.activity_id(ctx.activity)
    refute Map.has_key?(response, :error)
  end

  defp latest_goal_closing(goal) do
    import Ecto.Query, only: [from: 2]

    from(a in Operately.Activities.Activity,
      where: a.action == "goal_closing",
      where: a.content["goal_id"] == ^goal.id,
      order_by: [desc: a.inserted_at],
      limit: 1,
      preload: [:comment_thread]
    )
    |> Operately.Repo.one!()
  end
end
