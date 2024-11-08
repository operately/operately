defmodule Operately.Activities.Notifications.ProjectKeyResourceAdded do
  alias Operately.{Notifications, Projects}

  def dispatch(activity) do
    author_id = activity.author_id
    project_id = activity.content["project_id"]

    Projects.list_notification_subscribers(project_id, exclude: author_id)
    |> Enum.map(fn person ->
      %{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)
    |> Notifications.bulk_create()
  end
end
