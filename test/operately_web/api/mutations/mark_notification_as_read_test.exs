defmodule OperatelyWeb.Api.Mutations.MarkNotificationsAsReadTest do
  use OperatelyWeb.TurboCase

  import Operately.ActivitiesFixtures
  import Operately.NotificationsFixtures
  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :mark_notification_as_read, %{})
    end

    test "you can't mark someone else's notification as read", ctx do
      ctx = register_and_log_in_account(ctx)
      someone_else = person_fixture(company_id: ctx.person.company_id)

      a1 = activity_fixture(author_id: ctx.person.id)
      n1 = notification_fixture(person_id: ctx.person.id, read: false, activity_id: a1.id)

      a2 = activity_fixture(author_id: someone_else.id)
      n2 = notification_fixture(person_id: someone_else.id, read: false, activity_id: a2.id)

      assert {200, %{}} = mutation(ctx.conn, :mark_notification_as_read, %{id: n1.id})
      assert mutation(ctx.conn, :mark_notification_as_read, %{id: n2.id}) == not_found_response()

      assert Operately.Notifications.get_notification!(n1.id).read
      refute Operately.Notifications.get_notification!(n2.id).read
    end
  end

  describe "mark_all_as_read functionality" do
    setup :register_and_log_in_account

    test "it marks the notification as read", ctx do
      activity = activity_fixture(author_id: ctx.person.id)
      n1 = notification_fixture(person_id: ctx.person.id, read: false, activity_id: activity.id)

      assert {200, %{}} = mutation(ctx.conn, :mark_notification_as_read, %{id: n1.id})

      assert Operately.Notifications.get_notification!(n1.id).read
    end
  end
end 
