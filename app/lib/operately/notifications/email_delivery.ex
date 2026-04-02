defmodule Operately.Notifications.EmailDelivery do
  import Ecto.Query

  alias Operately.Notifications.Notification
  alias Operately.Repo

  def mark_sent(notification_or_notifications, sent_at \\ current_time())

  def mark_sent(%Notification{} = notification, sent_at) do
    notification
    |> Notification.changeset(%{
      email_sent: true,
      email_sent_at: sent_at
    })
    |> Repo.update()
  end

  def mark_sent([], _sent_at), do: {:ok, true}

  def mark_sent(notifications, sent_at) when is_list(notifications) do
    ids = Enum.map(notifications, & &1.id)

    from(n in Notification, where: n.id in ^ids)
    |> Repo.update_all(set: [email_sent: true, email_sent_at: sent_at, updated_at: sent_at])

    {:ok, true}
  end

  defp current_time do
    NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
  end
end
