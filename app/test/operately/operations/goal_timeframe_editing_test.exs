defmodule Operately.Operations.GoalTimeframeEditingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Support.RichText
  alias Operately.Operations.GoalTimeframeEditing

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:champion, :space)
    |> Factory.add_space_member(:reviewer, :space)
    |> Factory.add_space_member(:member1, :space)
    |> Factory.add_space_member(:member2, :space)
    |> Factory.add_goal(:goal, :space, champion: :champion, reviewer: :reviewer)
  end

  describe "notifications" do
    test "Editing timeframe notifies everyone", ctx do
      Oban.Testing.with_testing_mode(:manual, fn -> edit_timeframe(ctx, true, []) end)

      action = "goal_timeframe_editing"
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

    test "Editing timeframe notifies selected people", ctx do
      Oban.Testing.with_testing_mode(:manual, fn -> edit_timeframe(ctx, false, [ctx.reviewer.id, ctx.champion.id]) end)

      action = "goal_timeframe_editing"
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

      edit_timeframe(ctx, true, [])

      action = "goal_timeframe_editing"
      activity = get_activity(ctx.goal, action)

      notifications = fetch_notifications(activity.id, action: action)
      notified_people_ids = Enum.map(notifications, & &1.person_id)

      refute ctx.non_space_member.id in notified_people_ids
    end
  end

  test "GoalTimeframeEditing operation updates goal", ctx do
    assert ctx.goal.timeframe.type == "year"

    {:ok, goal} = edit_timeframe(ctx, false, [], %{
      type: "days",
      start_date: ~D[2024-04-15],
      end_date: ~D[2024-08-30]
    })

    assert goal.timeframe.type == "days"
    assert goal.timeframe.start_date == ~D[2024-04-15]
    assert goal.timeframe.end_date == ~D[2024-08-30]
  end

  defp edit_timeframe(ctx, send_to_everyone, subscriber_ids, timeframe \\ nil) do
    timeframe = timeframe || %{
      type: "days",
      start_date: Date.utc_today(),
      end_date: Date.add(Date.utc_today(), 5)
    }

    GoalTimeframeEditing.run(
      ctx.creator,
      ctx.goal,
      %{
        timeframe: timeframe,
        content: RichText.rich_text("Timeframe update comments"),
        subscription_parent_type: :comment_thread,
        send_to_everyone: send_to_everyone,
        subscriber_ids: subscriber_ids
      }
    )
  end

  defp get_activity(goal, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["goal_id"] == ^goal.id
    )
    |> Repo.one()
  end
end
