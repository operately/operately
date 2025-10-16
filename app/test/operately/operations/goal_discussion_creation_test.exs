defmodule Operately.Operations.GoalDiscussionCreationTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Support.RichText
  alias Operately.Operations.GoalDiscussionCreation

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
    test "Creating goal discussion notifies everyone", ctx do
      Oban.Testing.with_testing_mode(:manual, fn -> create_discussion(ctx, true, []) end)

      action = "goal_discussion_creation"
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

    test "Creating goal discussion notifies selected people", ctx do
      Oban.Testing.with_testing_mode(:manual, fn -> create_discussion(ctx, false, [ctx.reviewer.id, ctx.champion.id]) end)

      action = "goal_discussion_creation"
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

      create_discussion(ctx, true, [])

      action = "goal_discussion_creation"
      activity = get_activity(ctx.goal, action)

      notifications = fetch_notifications(activity.id, action: action)
      notified_people_ids = Enum.map(notifications, & &1.person_id)

      refute ctx.non_space_member.id in notified_people_ids
    end
  end

  defp create_discussion(ctx, send_to_everyone, subscriber_ids) do
    {:ok, _} =
      GoalDiscussionCreation.run(ctx.creator, ctx.goal, %{
        title: "Title",
        content: RichText.rich_text("Some content"),
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
