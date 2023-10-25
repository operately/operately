defmodule Operately.Activities.Notifications.ProjectReviewSubmitted do
  alias Operately.Projects

  def dispatch(activity) do
    author_id = activity.author_id
    project_id = activity.content.project_id
    people = Projects.list_notification_subscribers(project_id, exclude: author_id)

    notifications = Enum.map(people, fn person ->
      %{
        person_id: person.id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)

    Operately.Notifications.bulk_create(notifications)
  end
end
