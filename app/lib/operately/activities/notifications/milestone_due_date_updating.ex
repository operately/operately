defmodule Operately.Activities.Notifications.MilestoneDueDateUpdating do
  @moduledoc """
  Notifies the following people:
  - Project champion

  The person who authored the comment is excluded from notifications.
  """

  alias Operately.Projects.Project

  def dispatch(activity) do
    project = Project.get!(:system, id: activity.content["project_id"], opts: [preload: :champion_contributor])

    champion_id = if project.champion_contributor, do: project.champion_contributor.person_id, else: nil

    [champion_id]
    |> Enum.filter(fn id -> id != nil end)
    |> Enum.filter(fn id -> id != activity.author_id end)
    |> Enum.map(fn id ->
      %{
        person_id: id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end
end
