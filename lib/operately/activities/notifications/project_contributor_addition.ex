defmodule Operately.Activities.Notifications.ProjectContributorAddition do
  def dispatch(activity) do
    person_id = activity.content["person_id"]

    notifications = [
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true,
      }
    ]

    Operately.Notifications.bulk_create(notifications)
  end
end
