defmodule Operately.Activities.Notifications.ProjectDueDateUpdating do
  @moduledoc """
  Notifies the following people:
  - Project champion
  - Project reviewer

  The person who authored the comment is excluded from notifications.
  """

  alias Operately.Projects.Project

  def dispatch(activity) do
    project = Project.get!(:system, id: activity.content["project_id"], opts: [preload: [:champion_contributor, :reviewer_contributor]])

    champion_id = if project.champion_contributor, do: project.champion_contributor.person_id, else: nil
    reviewer_id = if project.reviewer_contributor, do: project.reviewer_contributor.person_id, else: nil

    [champion_id, reviewer_id]
    |> Enum.filter(& &1)
    |> Enum.map(& &1)
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
