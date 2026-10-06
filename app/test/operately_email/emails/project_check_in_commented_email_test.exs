defmodule OperatelyEmail.Emails.ProjectCheckInCommentedEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Operately.NotificationsFixtures
  import Swoosh.TestAssertions

  alias Operately.Notifications
  alias Operately.Notifications.EmailWorker
  alias OperatelyEmail.Emails.ProjectCheckInCommentedEmail
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_check_in(:check_in, :project, :creator)
    |> Factory.add_comment(:comment, :check_in)
    |> add_notification()
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

    assert :skip = ProjectCheckInCommentedEmail.buffered_item(ctx.creator, ctx.activity)
  end

  test "buffered item links the update to the comment on the check-in", ctx do
    item = ProjectCheckInCommentedEmail.buffered_item(ctx.creator, ctx.activity)

    assert item.item_url == Paths.project_check_in_path(ctx.company, ctx.check_in, ctx.comment) |> Paths.to_url()
  end

  test "missing project errors remain visible for existing comments", ctx do
    activity = %{ctx.activity | content: Map.put(ctx.activity.content, "project_id", Ecto.UUID.generate())}

    assert_raise Ecto.NoResultsError, fn -> ProjectCheckInCommentedEmail.send(ctx.creator, activity) end
    assert_raise Ecto.NoResultsError, fn -> ProjectCheckInCommentedEmail.buffered_item(ctx.creator, activity) end
  end

  defp add_notification(ctx) do
    activity =
      activity_fixture(%{
        action: "project_check_in_commented",
        author_id: ctx.creator.id,
        content: %{
          "project_id" => ctx.project.id,
          "check_in_id" => ctx.check_in.id,
          "comment_id" => ctx.comment.id
        }
      })

    notification = notification_fixture(activity_id: activity.id, person_id: ctx.creator.id, email_sent: false, email_sent_at: nil)

    Map.merge(ctx, %{activity: activity, notification: notification})
  end
end
