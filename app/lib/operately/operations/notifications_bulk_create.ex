defmodule Operately.Operations.NotificationsBulkCreate do
  import Ecto.Query, warn: false

  alias Ecto.Multi
  alias Operately.Notifications.{
    BufferedEmailPolicy,
    BufferedEmailWorker,
    DirectMentionClassifier,
    EmailBatch,
    EmailWorker,
    Notification
  }
  alias Operately.Repo

  def run(notifications) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    notifications = Enum.map(notifications, fn notification ->
      Map.merge(notification, %{inserted_at: now, updated_at: now})
    end)

    Multi.new()
    |> Multi.run(:notifications, fn repo, _ ->
      {_, notifications} = repo.insert_all(Notification, notifications, returning: [:id, :person_id])
      {:ok, notifications}
    end)
    |> Multi.run(:email_routing, fn repo, %{notifications: notifications} ->
      route_email_delivery(repo, notifications, now)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{notifications: notifications}} ->
        unique_person_ids = Enum.uniq(Enum.map(notifications, & &1.person_id))

        Enum.each(unique_person_ids, fn person_id ->
          OperatelyWeb.ApiSocket.broadcast!("api:unread_notifications_count:#{person_id}")
        end)

        {:ok, notifications}

      {:error, _operation, _value, _changes} ->
        {:error, :failed_to_create_notifications}
    end
  end

  defp route_email_delivery(repo, inserted_notifications, now) do
    notifications =
      inserted_notifications
      |> Enum.map(& &1.id)
      |> load_inserted_notifications(repo)

    mention_lookup =
      if Enum.any?(notifications, &needs_mention_classification?/1) do
        DirectMentionClassifier.classify(notifications)
      else
        %{}
      end

    notifications
    |> Enum.group_by(&email_delivery_route(&1, mention_lookup))
    |> enqueue_immediate_emails()
    |> assign_buffered_batches(repo, now)

    {:ok, true}
  end

  defp load_inserted_notifications(notification_ids, repo) do
    from(n in Notification,
      where: n.id in ^notification_ids,
      join: activity in assoc(n, :activity),
      join: person in assoc(n, :person),
      join: company in assoc(person, :company),
      preload: [activity: activity, person: {person, company: company}]
    )
    |> repo.all()
  end

  defp email_delivery_route(notification, mention_lookup) do
    person = notification.person

    cond do
      not notification.should_send_email -> :no_email
      BufferedEmailPolicy.bypass_action?(notification.activity.action) -> :immediate_email
      BufferedEmailPolicy.notify_on_mention?(person) and Map.get(mention_lookup, notification.id, false) -> :immediate_email
      true -> :buffered_email
    end
  end

  defp needs_mention_classification?(notification) do
    person = notification.person

    notification.should_send_email &&
      not BufferedEmailPolicy.bypass_action?(notification.activity.action) &&
      BufferedEmailPolicy.notify_on_mention?(person)
  end

  defp enqueue_immediate_emails(grouped_notifications) do
    Enum.each(Map.get(grouped_notifications, :immediate_email, []), fn notification ->
      EmailWorker.new(%{notification_id: notification.id}) |> Oban.insert!()
    end)

    grouped_notifications
  end

  defp assign_buffered_batches(grouped_notifications, repo, now) do
    grouped_notifications
    |> Map.get(:buffered_email, [])
    |> Enum.group_by(& &1.person_id)
    |> Enum.each(fn {person_id, notifications} ->
      lock_person(repo, person_id)

      case find_open_batch(repo, person_id, now) do
        nil ->
          notifications
          |> create_batch(repo)
          |> attach_notifications(repo, notifications, now)
          |> schedule_batch_delivery(now)

        batch ->
          attach_notifications(batch, repo, notifications, now)
      end
    end)
  end

  defp create_batch(notifications, repo) do
    [first_notification | _] = Enum.sort_by(notifications, & &1.inserted_at, fn a, b -> NaiveDateTime.compare(a, b) != :gt end)
    person = first_notification.person
    window_minutes = BufferedEmailPolicy.buffer_window_minutes(person)

    {:ok, batch} =
      %EmailBatch{}
      |> EmailBatch.changeset(%{
        person_id: person.id,
        status: :scheduled,
        window_minutes: window_minutes,
        window_started_at: first_notification.inserted_at,
        send_at: NaiveDateTime.add(first_notification.inserted_at, window_minutes * 60, :second)
      })
      |> repo.insert()

    batch
  end

  defp attach_notifications(batch, repo, notifications, now) do
    notification_ids = Enum.map(notifications, & &1.id)

    from(n in Notification, where: n.id in ^notification_ids)
    |> repo.update_all(set: [email_batch_id: batch.id, updated_at: now])

    batch
  end

  defp schedule_batch_delivery(batch, now) do
    seconds_until_send =
      batch.send_at
      |> NaiveDateTime.diff(now, :second)
      |> max(0)

    BufferedEmailWorker.new(%{email_batch_id: batch.id}, schedule_in: seconds_until_send)
    |> Oban.insert()
  end

  defp find_open_batch(repo, person_id, now) do
    EmailBatch
    |> EmailBatch.open_for_person(person_id, now)
    |> repo.one()
  end

  defp lock_person(repo, person_id) do
    from(p in Operately.People.Person,
      where: p.id == ^person_id,
      lock: "FOR UPDATE",
      select: p.id
    )
    |> repo.one()
  end
end
