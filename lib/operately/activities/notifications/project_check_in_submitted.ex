defmodule Operately.Activities.Notifications.ProjectCheckInSubmitted do
  alias Operately.{Notifications, Projects}

  def dispatch(activity) do
    Projects.Notifications.get_check_in_subscribers(activity.content["check_in_id"])
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)
    |> Notifications.bulk_create()
  end
end
