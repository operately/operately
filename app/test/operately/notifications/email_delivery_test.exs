defmodule Operately.Notifications.EmailDeliveryTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Operately.CompaniesFixtures
  import Operately.NotificationsFixtures
  import Operately.PeopleFixtures

  alias Operately.Notifications
  alias Operately.Notifications.EmailDelivery

  setup do
    company = company_fixture()
    person = person_fixture(company_id: company.id, email: unique_account_email())
    activity = activity_fixture(author_id: person.id)

    {:ok, company: company, person: person, activity: activity}
  end

  test "mark_sent/1 updates a single notification", ctx do
    notification =
      notification_fixture(
        activity_id: ctx.activity.id,
        person_id: ctx.person.id,
        email_sent: false,
        email_sent_at: nil
      )

    assert {:ok, updated_notification} = EmailDelivery.mark_sent(notification, ~N[2026-04-02 11:30:00])

    assert updated_notification.email_sent
    assert updated_notification.email_sent_at == ~N[2026-04-02 11:30:00]
  end

  test "mark_sent/1 updates multiple notifications", ctx do
    notification_1 =
      notification_fixture(
        activity_id: ctx.activity.id,
        person_id: ctx.person.id,
        email_sent: false,
        email_sent_at: nil
      )

    notification_2 =
      notification_fixture(
        activity_id: ctx.activity.id,
        person_id: ctx.person.id,
        email_sent: false,
        email_sent_at: nil
      )

    assert {:ok, true} = EmailDelivery.mark_sent([notification_1, notification_2], ~N[2026-04-02 11:35:00])

    notification_1 = Notifications.get_notification!(notification_1.id)
    notification_2 = Notifications.get_notification!(notification_2.id)

    assert notification_1.email_sent
    assert notification_1.email_sent_at == ~N[2026-04-02 11:35:00]
    assert notification_2.email_sent
    assert notification_2.email_sent_at == ~N[2026-04-02 11:35:00]
  end
end
