defmodule Operately.Support.Notifications do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Notifications.Notification

  defmacro __using__(_opts) do
    quote do
       import Operately.Support.Notifications
    end
  end

  def notifications_count do
    Repo.aggregate(Notification, :count, :id)
  end

  def perform_job(activity_id) do
    Oban.Testing.perform_job(Operately.Activities.NotificationDispatcher, %{activity_id: activity_id}, [])
  end

  def fetch_notification(person_id) do
    from(n in Notification, where: n.person_id == ^person_id) |> Repo.one()
  end
end
