defmodule Operately.Activities.Notifications.SpaceMembersAdded do
  def dispatch(activity) do
    Enum.map(activity.content["members"], fn m ->
      %{
        person_id: m["person_id"],
        activity_id: activity.id,
        should_send_email: true,
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
