defmodule Operately.Activities.Notifications.CompanyOwnersAdding do
  def dispatch(activity) do
    Enum.map(activity.content["people"], fn p ->
      %{
        person_id: p["person_id"],
        activity_id: activity.id,
        should_send_email: true,
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
