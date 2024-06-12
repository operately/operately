defmodule OperatelyWeb.Api.Mutations.MarkAllNotificationsAsReadTest do
  use OperatelyWeb.TurboCase

  import Operately.ActivitiesFixtures
  import Operately.NotificationsFixtures
  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :mark_all_notifications_as_read, %{})
    end
  end

  describe "mark_all_as_read functionality" do
    setup :register_and_log_in_account

    test "it marks all unread notification as read", ctx do
      activity = activity_fixture(author_id: ctx.person.id)

      n1 = notification_fixture(person_id: ctx.person.id, read: false, activity_id: activity.id)
      n2 = notification_fixture(person_id: ctx.person.id, read: false, activity_id: activity.id)
      n3 = notification_fixture(person_id: ctx.person.id, read: true, activity_id: activity.id)

      assert {200, %{}} = mutation(ctx.conn, :mark_all_notifications_as_read, %{})

      assert Operately.Notifications.get_notification!(n1.id).read
      assert Operately.Notifications.get_notification!(n2.id).read
      assert Operately.Notifications.get_notification!(n3.id).read
    end

    test "it marks only current user's notifications as read", ctx do
      activity = activity_fixture(author_id: ctx.person.id)

      n1 = notification_fixture(person_id: ctx.person.id, read: false, activity_id: activity.id)
      n2 = notification_fixture(person_id: ctx.person.id, read: false, activity_id: activity.id)
      n3 = notification_fixture(person_id: ctx.person.id, read: true, activity_id: activity.id)

      other_person = person_fixture(company_id: ctx.person.company_id)
      n4 = notification_fixture(person_id: other_person.id, read: false, activity_id: activity.id)

      assert {200, %{}} = mutation(ctx.conn, :mark_all_notifications_as_read, %{})

      assert Operately.Notifications.get_notification!(n1.id).read
      assert Operately.Notifications.get_notification!(n2.id).read
      assert Operately.Notifications.get_notification!(n3.id).read
      refute Operately.Notifications.get_notification!(n4.id).read
    end
  end
end 
