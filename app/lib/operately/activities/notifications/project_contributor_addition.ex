defmodule Operately.Activities.Notifications.ProjectContributorAddition do
  def dispatch(activity) do
    person_id = activity.content["person_id"]
    author_id = activity.author_id

    if person_id != author_id do
      Operately.Notifications.bulk_create([
        %{
          person_id: person_id,
          activity_id: activity.id,
          should_send_email: true
        }
      ])
    else
      {:ok, []}
    end
  end
end
