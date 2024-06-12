defmodule OperatelyWeb.Api.Queries.GetUnreadNotificationCountTest do
  use OperatelyWeb.TurboCase

  import Operately.ActivitiesFixtures
  import Operately.NotificationsFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_unread_notification_count, %{})
    end
  end

  describe "get_unread_notification_count functionality" do
    setup :register_and_log_in_account

    test "returns the number of unread notifications", ctx do
      activity = activity_fixture(author_id: ctx.person.id)

      notification_fixture(person_id: ctx.person.id, read: false, activity_id: activity.id)
      notification_fixture(person_id: ctx.person.id, read: true, activity_id: activity.id)
      notification_fixture(person_id: ctx.person.id, read: true, activity_id: activity.id)

      assert {200, res} = query(ctx.conn, :get_unread_notification_count, %{})
      assert res == %{unread: 1}
    end
  end
end 
