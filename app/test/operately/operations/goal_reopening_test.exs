defmodule Operately.Operations.GoalReopeningTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Support.RichText
  alias Operately.Operations.GoalReopening
  alias Operately.Goals.Goal

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.add_space_member(:member1, :space)
    |> Factory.add_space_member(:member2, :space)
    |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer)
    |> setup_closed_goal()
  end

  defp setup_closed_goal(ctx) do
    {:ok, goal} =
      ctx.goal
      |> Goal.changeset(%{
        closed_at: DateTime.utc_now(),
        closed_by_id: ctx.creator.id
      })
      |> Repo.update()

    Map.put(ctx, :goal, goal)
  end

  describe "notifications" do
    test "Reopening goal notifies everyone", ctx do
      Oban.Testing.with_testing_mode(:manual, fn -> reopen_goal(ctx, true, []) end)

      action = "goal_reopening"
      activity = get_activity(ctx.goal, action)

      assert notifications_count(action: action) == 0

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)
      notified_people_ids = Enum.map(notifications, & &1.person_id)

      assert notifications_count(action: action) == 4

      [ctx.member1, ctx.member2, ctx.reviewer, ctx.champion]
      |> Enum.each(fn person ->
        assert Enum.member?(notified_people_ids, person.id)
      end)
    end

    test "Reopening goal notifies selected people", ctx do
      Oban.Testing.with_testing_mode(:manual, fn -> reopen_goal(ctx, false, [ctx.reviewer.id, ctx.champion.id]) end)

      action = "goal_reopening"
      activity = get_activity(ctx.goal, action)

      assert notifications_count(action: action) == 0

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)
      notified_people_ids = Enum.map(notifications, & &1.person_id)

      # reviewer + champion
      assert notifications_count(action: action) == 2
      assert ctx.reviewer.id in notified_people_ids
      assert ctx.champion.id in notified_people_ids
    end

    test "person without permissions is not notified", ctx do
      ctx = Factory.add_space(ctx, :other_space)
      ctx = Factory.add_space_member(ctx, :non_space_member, :other_space)

      reopen_goal(ctx, true, [])

      action = "goal_reopening"
      activity = get_activity(ctx.goal, action)

      notifications = fetch_notifications(activity.id, action: action)
      notified_people_ids = Enum.map(notifications, & &1.person_id)

      refute ctx.non_space_member.id in notified_people_ids
    end
  end

  test "GoalReopening operation updates goal", ctx do
    assert ctx.goal.closed_at != nil
    assert ctx.goal.closed_by_id == ctx.creator.id

    {:ok, goal} = reopen_goal(ctx, false, [])

    assert goal.closed_at == nil
    assert goal.closed_by_id == nil
  end

  defp reopen_goal(ctx, send_to_everyone, subscriber_ids) do
    GoalReopening.run(ctx.creator, ctx.goal, %{
      content: RichText.rich_text("Reopening comments"),
      subscription_parent_type: :comment_thread,
      send_to_everyone: send_to_everyone,
      subscriber_ids: subscriber_ids
    })
  end

  defp get_activity(goal, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["goal_id"] == ^goal.id
    )
    |> Repo.one()
  end
end
