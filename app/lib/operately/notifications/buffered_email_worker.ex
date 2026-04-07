defmodule Operately.Notifications.BufferedEmailWorker do
  use Oban.Worker, queue: :mailer

  import Ecto.Query

  alias Operately.Notifications.EmailBatch
  alias Operately.Notifications.EmailWorker
  alias Operately.Notifications.Notification
  alias Operately.Repo
  alias OperatelyEmail.Mailers.DigestMailer

  require Logger

  def perform(%{args: %{"email_batch_id" => email_batch_id}}) do
    batch = Repo.get!(EmailBatch, email_batch_id)

    case batch.status do
      :sent -> :ok
      :skipped -> :ok
      _ -> deliver_batch(batch)
    end
  end

  defp deliver_batch(batch) do
    mark_batch(batch, %{status: :sending, error: nil})

    notifications =
      from(n in Notification,
        where: n.email_batch_id == ^batch.id and n.email_sent == false,
        join: activity in assoc(n, :activity),
        preload: [activity: activity],
        order_by: [asc: n.inserted_at]
      )
      |> Repo.all()

    case notifications do
      [] ->
        finalize_empty_batch(batch)

      [single_notification] ->
        deliver_single_notification(single_notification, batch)

      multiple_notifications ->
        deliver_digest(multiple_notifications, batch)
    end
  end

  defp deliver_single_notification(notification, batch) do
    case EmailWorker.deliver(notification) do
      {:ok, _result} ->
        mark_batch(batch, %{status: :sent, sent_at: current_time()})
        :ok

      {:error, reason} ->
        mark_batch(batch, %{status: :failed, error: inspect(reason)})
        {:error, reason}
    end
  end

  defp deliver_digest(notifications, batch) do
    batch = Repo.preload(batch, :person)
    {digest_items, sent_notifications} = build_digest_items(notifications, batch.person)

    case digest_items do
      [] ->
        mark_batch(batch, %{status: :skipped, sent_at: nil})
        :ok

      _ ->
        case DigestMailer.send(batch.person, batch, digest_items) do
          {:ok, _result} ->
            mark_notifications_sent(sent_notifications)
            mark_batch(batch, %{status: :sent, sent_at: current_time()})
            :ok

          {:error, reason} ->
            mark_batch(batch, %{status: :failed, error: inspect(reason)})
            {:error, reason}
        end
    end
  end

  defp build_digest_items(notifications, person) do
    {digest_items, skipped_notifications} =
      Enum.reduce(notifications, {[], []}, fn notification, {items, skipped} ->
        activity = notification.activity

        if has_buffered_item?(activity) do
          module = email_module(activity)
          item = apply(module, :buffered_item, [person, activity])

          {[item | items], skipped}
        else
          Logger.warning("Activity #{activity.action} does not have buffered_item/2 implemented, skipping notification #{notification.id}")
          {items, [notification | skipped]}
        end
      end)

    digest_items = Enum.reverse(digest_items)
    sent_notifications = notifications -- skipped_notifications

    {digest_items, sent_notifications}
  end

  defp has_buffered_item?(activity) do
    module = email_module(activity)
    Code.ensure_loaded?(module) && function_exported?(module, :buffered_item, 2)
  rescue
    ArgumentError -> false
  end

  defp email_module(activity) do
    String.to_existing_atom("Elixir.OperatelyEmail.Emails.#{Macro.camelize(activity.action)}Email")
  end

  defp mark_notifications_sent(notifications) do
    notification_ids = Enum.map(notifications, & &1.id)
    now = current_time()

    from(n in Notification, where: n.id in ^notification_ids)
    |> Repo.update_all(set: [email_sent: true, email_sent_at: now, updated_at: now])
  end

  defp finalize_empty_batch(batch) do
    notification_count =
      from(n in Notification, where: n.email_batch_id == ^batch.id, select: count(n.id))
      |> Repo.one()

    status = if notification_count > 0, do: :sent, else: :skipped
    sent_at = if status == :sent, do: current_time(), else: nil

    mark_batch(batch, %{status: status, sent_at: sent_at})

    :ok
  end

  defp mark_batch(batch, attrs) do
    batch
    |> EmailBatch.changeset(attrs)
    |> Repo.update!()
  end

  defp current_time do
    NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
  end
end
