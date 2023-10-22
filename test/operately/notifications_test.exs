defmodule Operately.NotificationsTest do
  use Operately.DataCase

  alias Operately.Notifications

  describe "notifications" do
    alias Operately.Notifications.Notification

    import Operately.NotificationsFixtures
    import Operately.CompaniesFixtures
    import Operately.PeopleFixtures
    import Operately.ActivitiesFixtures

    setup do
      company = company_fixture()
      person = person_fixture(company_id: company.id)
      activity = activity_fixture(%{author_id: person.id})
      notification = notification_fixture(activity_id: activity.id, person_id: person.id)

      {:ok, company: company, person: person, activity: activity, notification: notification}
    end

    test "list_notifications/0 returns all notifications", ctx do
      assert Notifications.list_notifications() == [ctx.notification]
    end

    test "get_notification!/1 returns the notification with given id", ctx do
      assert Notifications.get_notification!(ctx.notification.id) == ctx.notification
    end
  end
end
