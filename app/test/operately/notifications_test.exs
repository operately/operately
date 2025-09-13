defmodule Operately.NotificationsTest do
  use Operately.DataCase

  alias Operately.Notifications

  describe "notifications" do
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

    test "bulk_create/1 prevents duplicate notifications for same activity and person", ctx do
      # Create a notification for the activity and person
      notifications = [
        %{
          person_id: ctx.person.id,
          activity_id: ctx.activity.id,
          should_send_email: false,
        }
      ]

      {:ok, first_batch} = Notifications.bulk_create(notifications)
      assert length(first_batch) == 1

      # Try to create the same notification again - should not create duplicates
      {:ok, second_batch} = Notifications.bulk_create(notifications)
      assert length(second_batch) == 0

      # Verify only one notification exists
      all_notifications = Notifications.list_notifications()
      person_activity_notifications = Enum.filter(all_notifications, fn n -> 
        n.person_id == ctx.person.id and n.activity_id == ctx.activity.id
      end)
      
      assert length(person_activity_notifications) == 1
    end
  end
end
