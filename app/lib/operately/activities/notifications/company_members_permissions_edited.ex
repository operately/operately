defmodule Operately.Activities.Notifications.CompanyMembersPermissionsEdited do
  def dispatch(activity) do
    Enum.map(activity.content["members"], fn member ->
      %{
        person_id: member["person_id"],
        activity_id: activity.id,
        should_send_email: true,
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
