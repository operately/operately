defmodule Operately.Activities.Notifications.CompanyMemberRestoring do
  def dispatch(activity) do
    Operately.Notifications.bulk_create([
      %{
        person_id: activity.content["person_id"],
        activity_id: activity.id,
        should_send_email: true,
      }
    ])
  end
end
