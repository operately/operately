defmodule Operately.Notifications.BufferedEmailWorkerTest do
  use Operately.DataCase

  import Mock

  import Operately.ActivitiesFixtures
  import Operately.CompaniesFixtures
  import Operately.NotificationsFixtures
  import Operately.PeopleFixtures

  alias Operately.Notifications
  alias Operately.Notifications.BufferedEmailWorker

  setup do
    company = company_fixture()
    person = person_fixture_with_account(%{company_id: company.id})

    {:ok, batch} =
      Notifications.create_email_batch(%{
        person_id: person.id,
        status: :scheduled,
        window_minutes: 5,
        window_started_at: ~N[2026-04-02 10:00:00],
        send_at: ~N[2026-04-02 10:05:00]
      })

    activity_one = activity_fixture(author_id: person.id, action: "project_created")
    activity_two = activity_fixture(author_id: person.id, action: "project_created")

    notification_one =
      notification_fixture(
        activity_id: activity_one.id,
        person_id: person.id,
        email_batch_id: batch.id,
        email_sent: false,
        email_sent_at: nil
      )

    notification_two =
      notification_fixture(
        activity_id: activity_two.id,
        person_id: person.id,
        email_batch_id: batch.id,
        email_sent: false,
        email_sent_at: nil
      )

    {:ok, person: person, batch: batch, notifications: [notification_one, notification_two]}
  end

  test "delivers pending notifications and marks the batch as sent", ctx do
    with_mocks([
      {Operately.People, [:passthrough], [get_person!: fn _id -> ctx.person end]},
      {Operately.Activities, [:passthrough], [get_activity!: fn _id -> %Operately.Activities.Activity{action: "project_created"} end]},
      {OperatelyEmail.Emails.ProjectCreatedEmail, [:passthrough], [send: fn _person, _activity -> {:ok, :delivered} end]}
    ]) do
      assert :ok = BufferedEmailWorker.perform(%{args: %{"email_batch_id" => ctx.batch.id}})
    end

    batch = Notifications.get_email_batch!(ctx.batch.id)
    notifications = Notifications.list_notifications(Enum.map(ctx.notifications, & &1.id))

    assert batch.status == :sent
    refute is_nil(batch.sent_at)
    assert Enum.all?(notifications, & &1.email_sent)
    assert Enum.all?(notifications, &(not is_nil(&1.email_sent_at)))
  end

  test "marks an empty batch as skipped", ctx do
    Enum.each(ctx.notifications, &Notifications.delete_notification/1)

    assert :ok = BufferedEmailWorker.perform(%{args: %{"email_batch_id" => ctx.batch.id}})

    batch = Notifications.get_email_batch!(ctx.batch.id)

    assert batch.status == :skipped
    assert is_nil(batch.sent_at)
  end
end
