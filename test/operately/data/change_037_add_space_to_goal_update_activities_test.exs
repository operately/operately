defmodule Operately.Data.Change037AddSpaceToGoalUpdateActivitiesTest do
  use Operately.DataCase
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  describe "migration doesn't delete existing data in activity content" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
    end

    test "goal_check_in and goal_check_in_acknowledgement", ctx do
      updates = Enum.map(1..3, fn _ ->
        {:ok, update} = Operately.Operations.GoalCheckIn.run(ctx.creator, ctx.goal, %{
          goal_id: ctx.goal.id,
          target_values: [],
          content: RichText.rich_text("content"),
          send_to_everyone: false,
          subscription_parent_type: :goal_update,
          subscriber_ids: [],
        })
        {:ok, _} = Operately.Operations.GoalUpdateAcknowledging.run(ctx.creator, update)
        update
      end)

      Operately.Data.Change037AddSpaceToGoalUpdateActivities.run()

      fetch_activities("goal_check_in")
      |> Enum.each(fn activity ->
        assert activity.content["company_id"] == ctx.company.id
        assert activity.content["space_id"] == ctx.space.id
        assert activity.content["goal_id"] == ctx.goal.id
        assert Enum.find(updates, &(&1.id == activity.content["update_id"]))
      end)

      fetch_activities("goal_check_in_acknowledgement")
      |> Enum.each(fn activity ->
        assert activity.content["company_id"] == ctx.company.id
        assert activity.content["space_id"] == ctx.space.id
        assert activity.content["goal_id"] == ctx.goal.id
        assert Enum.find(updates, &(&1.id == activity.content["update_id"]))
      end)
    end

    test "goal_check_in_commented", ctx do
      ctx = Factory.add_goal_update(ctx, :update, :goal, :creator)

      comments = Enum.map(1..3, fn _ ->
        {:ok, comment} = Operately.Operations.CommentAdding.run(ctx.creator, ctx.update, "goal_update", RichText.rich_text("content"))
        comment
      end)

      Operately.Data.Change037AddSpaceToGoalUpdateActivities.run()

      fetch_activities("goal_check_in_commented")
      |> Enum.each(fn activity ->
        assert activity.content["company_id"] == ctx.company.id
        assert activity.content["space_id"] == ctx.space.id
        assert activity.content["goal_id"] == ctx.goal.id
        assert activity.content["goal_check_in_id"] == ctx.update.id
        assert Enum.find(comments, &(&1.id == activity.content["comment_id"]))
      end)
    end
 end

  #
  # Helpers
  #

  defp fetch_activities(action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action
    )
    |> Repo.all()
  end
end
