defmodule Operately.Notifications.EmailBatchTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Operately.CompaniesFixtures
  import Operately.NotificationsFixtures
  import Operately.PeopleFixtures

  alias Operately.Notifications
  alias Operately.Notifications.EmailBatch

  setup do
    company = company_fixture()
    person = person_fixture(company_id: company.id, email: unique_account_email())

    {:ok, company: company, person: person}
  end

  test "create_email_batch/1 creates a batch", ctx do
    assert {:ok, %EmailBatch{} = batch} = Notifications.create_email_batch(batch_attrs(ctx.person.id))

    assert batch.person_id == ctx.person.id
    assert batch.status == :scheduled
    assert batch.window_minutes == 5
  end

  test "query helpers filter batches by status, time, and person", ctx do
    other_person = person_fixture(company_id: ctx.company.id, email: unique_account_email())

    {:ok, scheduled_due} =
      Notifications.create_email_batch(
        batch_attrs(ctx.person.id, %{send_at: ~N[2026-04-02 10:05:00]})
      )

    {:ok, scheduled_future} =
      Notifications.create_email_batch(
        batch_attrs(ctx.person.id, %{send_at: ~N[2026-04-02 10:15:00]})
      )

    {:ok, sending_batch} =
      Notifications.create_email_batch(
        batch_attrs(ctx.person.id, %{status: :sending, send_at: ~N[2026-04-02 10:04:00]})
      )

    {:ok, _other_person_batch} =
      Notifications.create_email_batch(
        batch_attrs(other_person.id, %{send_at: ~N[2026-04-02 10:03:00]})
      )

    due_batches =
      EmailBatch
      |> EmailBatch.scheduled()
      |> EmailBatch.for_person(ctx.person.id)
      |> EmailBatch.due_for_delivery(~N[2026-04-02 10:06:00])
      |> Repo.all()

    active_batches =
      EmailBatch
      |> EmailBatch.active()
      |> EmailBatch.for_person(ctx.person.id)
      |> Repo.all()

    open_batch =
      EmailBatch
      |> EmailBatch.open_for_person(ctx.person.id, ~N[2026-04-02 10:06:00])
      |> Repo.all()

    assert Enum.map(due_batches, & &1.id) == [scheduled_due.id]
    assert Enum.sort(Enum.map(active_batches, & &1.id)) == Enum.sort([scheduled_due.id, scheduled_future.id, sending_batch.id])
    assert Enum.map(open_batch, & &1.id) == [scheduled_future.id]
  end

  test "notifications can belong to an email batch", ctx do
    {:ok, batch} = Notifications.create_email_batch(batch_attrs(ctx.person.id))
    activity = activity_fixture(author_id: ctx.person.id)

    notification =
      notification_fixture(
        activity_id: activity.id,
        person_id: ctx.person.id,
        email_batch_id: batch.id
      )

    assert notification.email_batch_id == batch.id
  end

  defp batch_attrs(person_id, attrs \\ %{}) do
    Enum.into(attrs, %{
      person_id: person_id,
      window_minutes: 5,
      window_started_at: ~N[2026-04-02 10:00:00],
      send_at: ~N[2026-04-02 10:05:00]
    })
  end
end
