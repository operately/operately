defmodule Operately.Activities.Notifications.ProjectMilestoneCommented do
  @moduledoc """
  Notifies the following people:
  - Project contributors
  - Subscribers

  The person who authored the comment is excluded from notifications.
  """

  require Logger

  alias Operately.Repo
  alias Operately.Projects.Notifications
  alias Operately.Projects.{Milestone, Project}

  def dispatch(activity = %{ author_id: author_id }) do
    with {:ok, milestone} <- fetch_milestone(activity.content["milestone_id"]),
         {:ok, project} <- fetch_project(activity.content["project_id"]) do
      project_subscribers = Notifications.get_project_subscribers(project)
      milestone_subscribers = Notifications.get_milestone_subscribers(milestone)

      project_subscribers ++ milestone_subscribers
      |> Enum.uniq()
      |> Enum.filter(fn id -> id != author_id end)
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

  defp fetch_milestone(milestone_id) do
    case Milestone.get(:system, id: milestone_id, opts: [preload: [:project]]) do
      {:ok, milestone} ->
        {:ok, milestone}

      {:error, reason} ->
        Logger.warning(
          "Unable to load milestone #{milestone_id} for comment notifications: #{inspect(reason)}"
        )

        {:error, reason}
    end
  end

  defp fetch_project(project_id) do
    case Project.get(:system, id: project_id) do
      {:ok, project} ->
        {:ok, project}

      {:error, reason} ->
        Logger.warning(
          "Unable to load project #{project_id} for comment notifications: #{inspect(reason)}"
        )

        {:error, reason}
    end
  end
end
