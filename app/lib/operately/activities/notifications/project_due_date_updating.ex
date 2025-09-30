defmodule Operately.Activities.Notifications.ProjectDueDateUpdating do
  alias Operately.Projects

  def dispatch(activity) do
    project = Projects.get_project!(activity.content["project_id"])

    [Projects.get_champion(project), Projects.get_reviewer(project)]
    |> Enum.filter(& &1)
    |> Enum.map(& &1.id)
    |> Enum.uniq()
    |> Enum.reject(&(&1 == activity.author_id))
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
