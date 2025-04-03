defmodule Operately.Activities.Notifications.ProjectContributorsAddition do
  def dispatch(activity) do
    activity.content["contributors"]
    |> Enum.map(fn contributor ->
      %{
        person_id: contributor["person_id"],
        activity_id: activity.id,
        should_send_email: true,
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
