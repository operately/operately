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
  alias Operately.Projects.Milestone

  def dispatch(activity = %{ author_id: author_id }) do
    with {:ok, milestone} <- fetch_milestone(activity.content["milestone_id"]) do
      contribs = Operately.Projects.list_notification_subscribers(milestone.project_id, exclude: author_id)
      subscriber_ids = Notifications.get_milestone_subscribers(milestone)

      subscriber_ids ++ Enum.map(contribs, &(&1.id))
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
        {:ok,
         Repo.preload(milestone, [
           :access_context,
           subscription_list: :subscriptions
         ])}

      {:error, reason} ->
        Logger.warning(
          "Unable to load milestone #{milestone_id} for comment notifications: #{inspect(reason)}"
        )

        {:error, reason}
    end
  end
end
