defmodule OperatelyWeb.Api.Mutations.MarkNotificationsAsReadTest do
  use OperatelyWeb.TurboCase

  import Operately.ActivitiesFixtures
  import Operately.NotificationsFixtures
  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :mark_notifications_as_read, %{})
    end

    test "you can't mark someone else's notification as read", ctx do
      ctx = register_and_log_in_account(ctx)
      someone_else = person_fixture(company_id: ctx.company.id)

      a = activity_fixture(author_id: ctx.person.id)
      n = notification_fixture(person_id: someone_else.id, read: false, activity_id: a.id)

      assert {404, res} = mutation(ctx.conn, :mark_notifications_as_read, %{ids: [n.id]})
      assert res.message == "The requested resource was not found"
      refute Operately.Notifications.get_notification!(n.id).read
    end
  end

  describe "mark_as_read functionality" do
    setup :register_and_log_in_account

    test "it marks notifications as read", ctx do
      a1 = activity_fixture(author_id: ctx.company_creator.id)
      a2 = activity_fixture(author_id: ctx.company_creator.id)

      n1 = notification_fixture(person_id: ctx.person.id, read: false, activity_id: a1.id)
      n2 = notification_fixture(person_id: ctx.person.id, read: false, activity_id: a2.id)

      assert {200, %{}} = mutation(ctx.conn, :mark_notifications_as_read, %{ids: [n1.id, n2.id]})

      assert Operately.Notifications.get_notification!(n1.id).read
      assert Operately.Notifications.get_notification!(n2.id).read
    end
  end
end
