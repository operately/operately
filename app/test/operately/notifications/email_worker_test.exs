defmodule Operately.Notifications.EmailWorkerTest do
  use Operately.DataCase

  import Mock

  import Operately.ActivitiesFixtures
  import Operately.CompaniesFixtures
  import Operately.NotificationsFixtures
  import Operately.PeopleFixtures

  alias Operately.Notifications
  alias Operately.Notifications.EmailWorker

  setup do
    company = company_fixture()
    person = person_fixture_with_account(%{company_id: company.id})
    activity = activity_fixture(author_id: person.id)

    notification =
      notification_fixture(
        activity_id: activity.id,
        person_id: person.id,
        email_sent: false,
        email_sent_at: nil
      )

    {:ok, company: company, person: person, activity: activity, notification: notification}
  end

  test "marks notification as sent after successful delivery", ctx do
    with_mocks([
      {Operately.People, [:passthrough], [get_person!: fn _id -> ctx.person end]},
      {Operately.Activities, [:passthrough], [get_activity!: fn _id -> %Operately.Activities.Activity{action: "project_created"} end]},
      {OperatelyEmail.Emails.ProjectCreatedEmail, [:passthrough], [send: fn _person, _activity -> {:ok, :delivered} end]}
    ]) do
      assert :ok = EmailWorker.perform(%{args: %{"notification_id" => ctx.notification.id}})
    end

    notification = Notifications.get_notification!(ctx.notification.id)

    assert notification.email_sent
    refute is_nil(notification.email_sent_at)
  end

  test "does not mark notification as sent when delivery returns an error", ctx do
    with_mocks([
      {Operately.People, [:passthrough], [get_person!: fn _id -> ctx.person end]},
      {Operately.Activities, [:passthrough], [get_activity!: fn _id -> %Operately.Activities.Activity{action: "project_created"} end]},
      {OperatelyEmail.Emails.ProjectCreatedEmail, [:passthrough], [send: fn _person, _activity -> {:error, :smtp_failure} end]}
    ]) do
      assert {:error, :smtp_failure} = EmailWorker.perform(%{args: %{"notification_id" => ctx.notification.id}})
    end

    notification = Notifications.get_notification!(ctx.notification.id)

    refute notification.email_sent
    assert is_nil(notification.email_sent_at)
  end

  test "does not mark notification as sent when recipient has no account", ctx do
    person_without_account = person_fixture(company_id: ctx.company.id, email: unique_account_email())

    notification =
      notification_fixture(
        activity_id: ctx.activity.id,
        person_id: person_without_account.id,
        email_sent: false,
        email_sent_at: nil
      )

    with_mocks([
      {Operately.People, [:passthrough], [get_person!: fn _id -> person_without_account end]},
      {Operately.Activities, [:passthrough], [get_activity!: fn _id -> %Operately.Activities.Activity{action: "project_created"} end]}
    ]) do
      assert :ok = EmailWorker.perform(%{args: %{"notification_id" => notification.id}})
    end

    notification = Notifications.get_notification!(notification.id)

    refute notification.email_sent
    assert is_nil(notification.email_sent_at)
  end
end
