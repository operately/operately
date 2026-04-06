defmodule Operately.Notifications.BulkCreateTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  import Operately.ActivitiesFixtures
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Companies
  alias Operately.Notifications
  alias Operately.Notifications.BufferedEmailWorker
  alias Operately.Notifications.EmailBatch
  alias Operately.Notifications.EmailWorker
  alias Operately.Support.RichText

  setup do
    company = company_fixture()
    person = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, person: person}
  end

  test "keeps immediate delivery when the feature flag is disabled", ctx do
    activity = activity_fixture(author_id: ctx.person.id, action: "project_created")

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, notifications} =
               Notifications.bulk_create([
                 %{person_id: ctx.person.id, activity_id: activity.id, should_send_email: true}
               ])

      assert length(notifications) == 1
      assert_enqueued worker: EmailWorker, args: %{notification_id: hd(notifications).id}
      refute_enqueued worker: BufferedEmailWorker
    end)

    assert Repo.all(EmailBatch) == []
  end

  test "creates one buffered batch per person across different activity types", ctx do
    {:ok, _company} = Companies.enable_experimental_feature(ctx.company, "buffered_notifications")
    activity_one = activity_fixture(author_id: ctx.person.id, action: "project_created")
    activity_two = activity_fixture(author_id: ctx.person.id, action: "goal_created")

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, created_notifications} =
               Notifications.bulk_create([
                 %{person_id: ctx.person.id, activity_id: activity_one.id, should_send_email: true},
                 %{person_id: ctx.person.id, activity_id: activity_two.id, should_send_email: true}
               ])

      [batch] = Repo.all(EmailBatch)
      notifications = Notifications.list_notifications(Enum.map(created_notifications, & &1.id)) |> Enum.sort_by(& &1.inserted_at, NaiveDateTime)
      expected_send_at = DateTime.from_naive!(batch.send_at, "Etc/UTC")

      assert Enum.uniq(Enum.map(notifications, & &1.email_batch_id)) == [batch.id]
      assert batch.person_id == ctx.person.id
      assert batch.window_minutes == 5
      refute_enqueued worker: EmailWorker
      assert_enqueued worker: BufferedEmailWorker, args: %{email_batch_id: batch.id}, scheduled_at: {expected_send_at, delta: 2}
    end)
  end

  test "reuses an open batch without moving send_at or scheduling another worker", ctx do
    {:ok, _company} = Companies.enable_experimental_feature(ctx.company, "buffered_notifications")
    activity_one = activity_fixture(author_id: ctx.person.id, action: "project_created")
    activity_two = activity_fixture(author_id: ctx.person.id, action: "goal_created")

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, created_notifications} =
               Notifications.bulk_create([
                 %{person_id: ctx.person.id, activity_id: activity_one.id, should_send_email: true}
               ])

      [batch] = Repo.all(EmailBatch)
      original_send_at = batch.send_at

      assert {:ok, more_notifications} =
               Notifications.bulk_create([
                 %{person_id: ctx.person.id, activity_id: activity_two.id, should_send_email: true}
               ])

      [updated_batch] = Repo.all(EmailBatch)
      notifications =
        created_notifications
        |> Kernel.++(more_notifications)
        |> Enum.map(& &1.id)
        |> Notifications.list_notifications()

      assert length(all_enqueued(worker: BufferedEmailWorker)) == 1
      assert updated_batch.id == batch.id
      assert updated_batch.send_at == original_send_at
      assert Enum.uniq(Enum.map(notifications, & &1.email_batch_id)) == [batch.id]
    end)
  end

  test "creates a new batch after the existing fixed window has closed", ctx do
    {:ok, _company} = Companies.enable_experimental_feature(ctx.company, "buffered_notifications")
    activity = activity_fixture(author_id: ctx.person.id, action: "project_created")

    {:ok, existing_batch} =
      Notifications.create_email_batch(%{
        person_id: ctx.person.id,
        status: :scheduled,
        window_minutes: 5,
        window_started_at: ~N[2026-04-02 10:00:00],
        send_at: ~N[2026-04-02 10:05:00]
      })

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, _notifications} =
               Notifications.bulk_create([
                 %{person_id: ctx.person.id, activity_id: activity.id, should_send_email: true}
               ])

      batches = Repo.all(EmailBatch) |> Enum.sort_by(& &1.inserted_at, NaiveDateTime)
      [_, new_batch] = batches

      assert length(all_enqueued(worker: BufferedEmailWorker)) == 1
      refute new_batch.id == existing_batch.id
      assert new_batch.person_id == ctx.person.id
    end)
  end

  test "keeps bypassed actions on the immediate path even when buffering is enabled", ctx do
    {:ok, _company} = Companies.enable_experimental_feature(ctx.company, "buffered_notifications")
    activity = activity_fixture(author_id: ctx.person.id, action: "guest_invited")

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, notifications} =
               Notifications.bulk_create([
                 %{person_id: ctx.person.id, activity_id: activity.id, should_send_email: true}
               ])

      assert_enqueued worker: EmailWorker, args: %{notification_id: hd(notifications).id}
      refute_enqueued worker: BufferedEmailWorker
    end)

    assert Repo.all(EmailBatch) == []
  end

  test "mentions_only sends direct mentions immediately", ctx do
    {:ok, _company} = Companies.enable_experimental_feature(ctx.company, "buffered_notifications")

    {:ok, _person} =
      Operately.People.update_person(ctx.person, %{
        preferences: %{notifications: %{email_preference: :mentions_only}}
      })

    description = RichText.rich_text(mentioned_people: [ctx.person]) |> Jason.decode!()
    activity = activity_fixture(author_id: ctx.person.id, action: "project_description_changed", content: %{"description" => description})

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, notifications} =
               Notifications.bulk_create([
                 %{person_id: ctx.person.id, activity_id: activity.id, should_send_email: true}
               ])

      assert_enqueued worker: EmailWorker, args: %{notification_id: hd(notifications).id}
      refute_enqueued worker: BufferedEmailWorker
    end)

    assert Repo.all(EmailBatch) == []
  end

  test "mentions_only keeps non-mentions buffered for mention-capable actions", ctx do
    {:ok, _company} = Companies.enable_experimental_feature(ctx.company, "buffered_notifications")

    {:ok, _person} =
      Operately.People.update_person(ctx.person, %{
        preferences: %{notifications: %{email_preference: :mentions_only}}
      })

    description = RichText.rich_text("No mentions in this update")
    activity = activity_fixture(author_id: ctx.person.id, action: "project_description_changed", content: %{"description" => description})

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, [_notification]} =
               Notifications.bulk_create([
                 %{person_id: ctx.person.id, activity_id: activity.id, should_send_email: true}
               ])

      refute_enqueued worker: EmailWorker
      assert_enqueued worker: BufferedEmailWorker
    end)

    assert length(Repo.all(EmailBatch)) == 1
  end

  test "mentions_only keeps unsupported actions buffered", ctx do
    {:ok, _company} = Companies.enable_experimental_feature(ctx.company, "buffered_notifications")

    {:ok, _person} =
      Operately.People.update_person(ctx.person, %{
        preferences: %{notifications: %{email_preference: :mentions_only}}
      })

    activity = activity_fixture(author_id: ctx.person.id, action: "milestone_due_date_updating")

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, [_notification]} =
               Notifications.bulk_create([
                 %{person_id: ctx.person.id, activity_id: activity.id, should_send_email: true}
               ])

      refute_enqueued worker: EmailWorker
      assert_enqueued worker: BufferedEmailWorker
    end)

    assert length(Repo.all(EmailBatch)) == 1
  end
end
