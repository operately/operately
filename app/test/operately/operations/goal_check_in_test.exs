defmodule Operately.Operations.GoalCheckInTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  alias Operately.Support.RichText
  alias Operately.Operations.GoalCheckIn

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

  test "creating goal update sets last update on the goal", ctx do
    {:ok, update} =
      GoalCheckIn.run(ctx.champion, ctx.goal, %{
        goal_id: ctx.goal.id,
        status: "on_track",
        target_values: [],
        content: RichText.rich_text("Some content"),
        send_to_everyone: true,
        subscriber_ids: [],
        subscription_parent_type: :goal_update,
        due_date: %{date: ~D[2023-10-01], date_type: :day, value: "Oct 1, 2023"},
        checklist: []
      })

    ctx = Factory.reload(ctx, :goal)
    assert ctx.goal.last_check_in_id == update.id
    assert ctx.goal.last_update_status == update.status
  end

  test "creating goal update creates activity with old and new timeframes", ctx do
    ctx =
      Factory.add_goal(ctx, :goal2, :space,
        timeframe: %{
          type: "year",
          start_date: ~D[2023-01-01],
          end_date: ~D[2023-12-31],
          contextual_end_date: %{
            date_type: :year,
            date: ~D[2023-12-31],
            value: "2023"
          }
        }
      )

    {:ok, update} =
      GoalCheckIn.run(ctx.champion, ctx.goal2, %{
        goal_id: ctx.goal2.id,
        status: "on_track",
        target_values: [],
        checklist: [],
        content: RichText.rich_text("Some content"),
        send_to_everyone: true,
        subscriber_ids: [],
        subscription_parent_type: :goal_update,
        due_date: %{date: ~D[2024-06-30], date_type: :quarter, value: "Q2 2024"}
      })

    activity = get_activity(update, "goal_check_in")

    # Verify activity content
    assert activity.content["company_id"] == ctx.company.id
    assert activity.content["space_id"] == ctx.goal2.group_id
    assert activity.content["goal_id"] == ctx.goal2.id
    assert activity.content["update_id"] == update.id

    # Verify old timeframe content
    assert activity.content["old_timeframe"]["contextual_end_date"]["date_type"] == "year"
    assert activity.content["old_timeframe"]["contextual_end_date"]["date"] == Date.to_iso8601(~D[2023-12-31])
    assert activity.content["old_timeframe"]["contextual_end_date"]["value"] == "2023"

    # Verify new timeframe content
    assert activity.content["new_timeframe"]["contextual_end_date"]["date_type"] == "quarter"
    assert activity.content["new_timeframe"]["contextual_end_date"]["date"] == Date.to_iso8601(~D[2024-06-30])
    assert activity.content["new_timeframe"]["contextual_end_date"]["value"] == "Q2 2024"
  end

  describe "notifications" do
    test "Creating goal update notifies everyone", ctx do
      {:ok, update} =
        Oban.Testing.with_testing_mode(:manual, fn ->
          GoalCheckIn.run(ctx.champion, ctx.goal, %{
            goal_id: ctx.goal.id,
            status: "on_track",
            target_values: [],
            content: RichText.rich_text("Some content"),
            send_to_everyone: true,
            subscriber_ids: [],
            subscription_parent_type: :goal_update,
            due_date: %{date: ~D[2023-10-01], date_type: :day, value: "Oct 1, 2023"},
            checklist: []
          })
        end)

      action = "goal_check_in"
      activity = get_activity(update, action)

      assert notifications_count(action: action) == 0

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)
      notified_people_ids = Enum.map(notifications, & &1.person_id)

      # 2 members + reviewer + space creator
      assert notifications_count(action: action) == 4

      assert ctx.member1.id in notified_people_ids
      assert ctx.member2.id in notified_people_ids
      assert ctx.reviewer.id in notified_people_ids
    end

    test "Creating goal update notifies selected people", ctx do
      {:ok, update} =
        Oban.Testing.with_testing_mode(:manual, fn ->
          GoalCheckIn.run(ctx.champion, ctx.goal, %{
            goal_id: ctx.goal.id,
            status: "caution",
            target_values: [],
            content: RichText.rich_text("Some content"),
            send_to_everyone: false,
            subscriber_ids: [ctx.reviewer.id, ctx.champion.id],
            subscription_parent_type: :goal_update,
            due_date: %{date: ~D[2023-10-01], date_type: :day, value: "Oct 1, 2023"},
            checklist: []
          })
        end)

      action = "goal_check_in"
      activity = get_activity(update, action)

      assert notifications_count(action: action) == 0

      perform_job(activity.id)
      notifications = fetch_notifications(activity.id, action: action)
      notified_people_ids = Enum.map(notifications, & &1.person_id)

      # reviewer
      assert notifications_count(action: action) == 1
      assert ctx.reviewer.id in notified_people_ids
    end

    test "person without permissions is not notified", ctx do
      ctx = ctx |> Factory.add_space(:other_space)
      ctx = ctx |> Factory.add_space_member(:non_space_member, :other_space)

      {:ok, update} =
        GoalCheckIn.run(ctx.champion, ctx.goal, %{
          goal_id: ctx.goal.id,
          status: "off_track",
          target_values: [],
          checklist: [],
          content: RichText.rich_text("Some content"),
          send_to_everyone: true,
          subscriber_ids: [],
          subscription_parent_type: :goal_update,
          due_date: nil
        })

      action = "goal_check_in"
      activity = get_activity(update, action)

      notifications = fetch_notifications(activity.id, action: action)
      notified_people_ids = Enum.map(notifications, & &1.person_id)

      refute ctx.non_space_member.id in notified_people_ids
    end
  end

  #
  # Helpers
  #

  defp get_activity(update, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["update_id"] == ^update.id
    )
    |> Repo.one()
  end
end
