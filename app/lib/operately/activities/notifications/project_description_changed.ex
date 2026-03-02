defmodule Operately.Activities.Notifications.ProjectDescriptionChanged do
  @moduledoc """
  Notifies the following people:
  - People subscribed to the project

  The author of the activity is excluded from notifications.
  """

  require Logger
  alias Operately.Projects.Notifications

  def dispatch(activity) do
    {:ok, project} = fetch_project(activity.content["project_id"])
    project_subscribers = Notifications.get_project_subscribers(project, ignore: [activity.author_id])

    project_subscribers
    |> Enum.uniq()
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end

  defp fetch_project(project_id) do
    case Operately.Projects.Project.get(:system, id: project_id) do
      {:ok, project} ->
        {:ok, project}

      {:error, reason} ->
        Logger.warning(
          "Unable to load project #{project_id} for description change notifications: #{inspect(reason)}"
        )

        {:error, reason}
    end
  end
end
