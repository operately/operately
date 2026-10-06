defmodule OperatelyEmail.Emails.GoalCheckInCommentedEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Operately.NotificationsFixtures
  import Swoosh.TestAssertions

  alias Operately.Notifications
  alias Operately.Notifications.EmailWorker
  alias OperatelyEmail.Emails.GoalCheckInCommentedEmail
  alias OperatelyWeb.Paths

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_update(:check_in, :goal, :creator)
      |> Factory.preload(:check_in, [:goal])
      |> Factory.add_comment(:comment, :check_in)

    activity =
      activity_fixture(
        action: "goal_check_in_commented",
        author_id: ctx.creator.id,
        content: %{"goal_id" => ctx.goal.id, "goal_check_in_id" => ctx.check_in.id, "comment_id" => ctx.comment.id}
      )

    notification = notification_fixture(activity_id: activity.id, person_id: ctx.creator.id, email_sent: false, email_sent_at: nil)

    Map.merge(ctx, %{activity: activity, notification: notification})
  end

  test "delivers an individual email for an existing comment", ctx do
    assert {:ok, :sent} = EmailWorker.deliver(ctx.notification)
    assert_email_sent(to: ctx.creator.email)
    assert Notifications.get_notification!(ctx.notification.id).email_sent
  end

  test "skips individual delivery when the comment is deleted after notification creation", ctx do
    {:ok, _} = Operately.Updates.delete_comment(ctx.comment)

    assert {:ok, :skipped} = EmailWorker.deliver(ctx.notification)
    assert :ok = EmailWorker.perform(%{args: %{"notification_id" => ctx.notification.id}})
    refute_email_sent()

    notification = Notifications.get_notification!(ctx.notification.id)
    refute notification.email_sent
    assert is_nil(notification.email_sent_at)
  end

  test "skips a buffered item when its comment has been deleted", ctx do
    {:ok, _} = Operately.Updates.delete_comment(ctx.comment)

    assert :skip = GoalCheckInCommentedEmail.buffered_item(ctx.creator, ctx.activity)
  end

  test "builds a buffered item for an existing comment", ctx do
    item = GoalCheckInCommentedEmail.buffered_item(ctx.creator, ctx.activity)

    assert item.parent_id == ctx.goal.id
    assert item.item_url == Paths.goal_path(ctx.company, ctx.goal) |> Paths.to_url()
    assert item.excerpt_text =~ "Content"
  end

  test "missing goal errors remain visible for existing comments", ctx do
    activity = %{ctx.activity | content: Map.put(ctx.activity.content, "goal_id", Ecto.UUID.generate())}

    assert_raise KeyError, fn -> GoalCheckInCommentedEmail.send(ctx.creator, activity) end
    assert_raise KeyError, fn -> GoalCheckInCommentedEmail.buffered_item(ctx.creator, activity) end
  end
end
