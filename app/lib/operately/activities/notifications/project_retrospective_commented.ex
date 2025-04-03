defmodule Operately.Activities.Notifications.ProjectRetrospectiveCommented do
  alias Operately.Projects.Notifications

  def dispatch(activity) do
    Notifications.get_retrospective_subscribers(activity.content["retrospective_id"], ignore: [activity.author_id])
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
