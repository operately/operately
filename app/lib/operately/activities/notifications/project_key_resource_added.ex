defmodule Operately.Activities.Notifications.ProjectKeyResourceAdded do
  alias Operately.Projects.Notifications

  def dispatch(activity) do
    {:ok, project} = Operately.Projects.Project.get(:system, id: activity.content["project_id"])
    subscriber_ids = Notifications.get_project_subscribers(project, ignore: [activity.author_id])

    subscriber_ids
    |> Enum.uniq_by(& &1)
    |> Enum.filter(fn id -> id != nil end)
    |> Enum.filter(fn id -> id != activity.author_id end)
    |> Enum.map(fn id ->
      %{
        person_id: id,
        activity_id: activity.id,
        should_send_email: true,
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
