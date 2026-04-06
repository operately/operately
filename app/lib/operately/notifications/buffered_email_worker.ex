defmodule Operately.Notifications.BufferedEmailWorker do
  use Oban.Worker, queue: :mailer

  import Ecto.Query

  alias Operately.Notifications.EmailBatch
  alias Operately.Notifications.EmailWorker
  alias Operately.Notifications.Notification
  alias Operately.Repo

  def perform(%{args: %{"email_batch_id" => email_batch_id}}) do
    batch =
      EmailBatch
      |> Repo.get!(email_batch_id)

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
        order_by: [asc: n.inserted_at]
      )
      |> Repo.all()

    case notifications do
      [] ->
        finalize_empty_batch(batch)

      _ ->
        Enum.reduce_while(notifications, :ok, fn notification, _acc ->
          case EmailWorker.deliver(notification) do
            {:ok, _result} -> {:cont, :ok}
            {:error, reason} -> {:halt, {:error, reason}}
          end
        end)
        |> finalize_batch(batch)
    end
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

  defp finalize_batch(:ok, batch) do
    mark_batch(batch, %{status: :sent, sent_at: current_time()})
    :ok
  end

  defp finalize_batch({:error, reason}, batch) do
    mark_batch(batch, %{status: :failed, error: inspect(reason)})
    {:error, reason}
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
