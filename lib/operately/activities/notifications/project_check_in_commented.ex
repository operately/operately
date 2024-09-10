defmodule Operately.Activities.Notifications.ProjectCheckInCommented do
  alias Operately.Projects.Notifications

  def dispatch(activity) do
    Notifications.get_check_in_subscribers(activity.content["check_in_id"], ignore: [activity.author_id])
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
