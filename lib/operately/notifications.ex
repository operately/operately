defmodule Operately.Notifications do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Notifications.Notification

  def list_notifications do
    Repo.all(Notification)
  end

  def list_notifications(person, page: page, per_page: per_page) do
    query = from n in Notification,
      where: n.person_id == ^person.id,
      order_by: [desc: n.inserted_at]

    query = apply_pagination(query, page: page, per_page: per_page)

    Repo.all(query)
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

  defp apply_pagination(query, page: page, per_page: per_page) do
    query
    |> limit(^per_page)
    |> offset(^per_page * (^page - 1))
  end

  def mark_as_read(%Notification{} = notification) do
    update_notification(notification, %{
      read: true,
      read_at: DateTime.utc_now()
    })
  end
end
