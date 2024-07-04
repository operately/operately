defmodule Operately.Support.Notifications do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.People.Person
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

  def fetch_notification(activity_id) do
    from(n in Notification, where: n.activity_id == ^activity_id) |> Repo.one()
  end

  def fetch_notifications(activity_id) do
    from(n in Notification, where: n.activity_id == ^activity_id) |> Repo.all()
  end

  def notification_message(%Person{id: id, full_name: full_name}) do
    %{
      type: :doc,
      content: [
        %{
          type: :paragraph,
          content: [
            %{
              type: :mention,
              attrs: %{
                id: id,
                label: full_name
              }
            }
          ]
        }
      ]
    }
    |> Jason.encode!()
  end
end
