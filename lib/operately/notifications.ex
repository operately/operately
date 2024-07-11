defmodule Operately.Notifications do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Notifications.Notification

  def list_notifications do
    Repo.all(Notification)
  end

  def get_notification!(id), do: Repo.get!(Notification, id)

  def create_notification(attrs \\ %{}) do
    %Notification{}
    |> Notification.changeset(attrs)
    |> Repo.insert()
  end

  def update_notification(%Notification{} = notification, attrs) do
    notification
    |> Notification.changeset(attrs)
    |> Repo.update()
  end

  def delete_notification(%Notification{} = notification) do
    Repo.delete(notification)
  end

  def change_notification(%Notification{} = notification, attrs \\ %{}) do
    Notification.changeset(notification, attrs)
  end

  def mark_as_read(%Notification{} = notification) do
    {:ok, notification} = update_notification(notification, %{
      read: true,
      read_at: DateTime.utc_now()
    })

    OperatelyWeb.Api.publish(:unread_notification_count_changed, %{person_id: notification.person_id})

    {:ok, notification}
  end

  def mark_all_as_read(person) do
    now = DateTime.utc_now()

    query = from n in Notification, where: n.person_id == ^person.id and n.read == false

    Repo.update_all(query, [set: [read: true, read_at: now]])

    OperatelyWeb.Api.publish(:unread_notification_count_changed, %{person_id: person.id})

    {:ok, true}
  end

  def bulk_create(notifications) do
    alias Ecto.Multi
    alias Operately.Notifications.EmailWorker

    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    notifications = Enum.map(notifications, fn notification ->
      Map.merge(notification, %{inserted_at: now, updated_at: now})
    end)

    Multi.new()
    |> Multi.run(:notifications, fn repo, _ -> 
      {_, notifications} = repo.insert_all(Notification, notifications, returning: [:id, :should_send_email, :person_id])
      {:ok, notifications}
    end)
    |> Multi.merge(fn %{notifications: notifications} ->
      Enum.reduce(notifications, Ecto.Multi.new(), fn notification, multi ->
        if notification.should_send_email do
          Ecto.Multi.run(multi, "email_#{notification.id}", fn _repo, _ ->
            EmailWorker.new(%{notification_id: notification.id}) |> Oban.insert()
          end)
        else
          multi
        end
      end)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{notifications: notifications}} -> 
        unique_person_ids = Enum.uniq(Enum.map(notifications, &(&1.person_id)))

        Enum.each(unique_person_ids, fn person_id ->
          OperatelyWeb.Api.publish(:unread_notification_count_changed, %{person_id: person_id})
        end)

        {:ok, notifications}
      {:error, _} -> 
        {:error, :failed_to_create_notifications}
    end
  end

  def unread_notifications_count(person) do
    query = from n in Notification,
      where: n.person_id == ^person.id and n.read == false,
      select: count(n.id)

    Repo.one(query)
  end
end
