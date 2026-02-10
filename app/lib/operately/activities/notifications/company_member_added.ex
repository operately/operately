defmodule Operately.Activities.Notifications.CompanyMemberAdded do
  def dispatch(activity) do
    person_id = activity.content["person_id"]

    Operately.Notifications.bulk_create([%{
      person_id: person_id,
      activity_id: activity.id,
      should_send_email: true,
    }])
  end
end
