defmodule Operately.Activities.Notifications.ProjectMilestoneCommented do
  @moduledoc """
  Notifies the following people:
  - Project champion
  - Subscriber

  The person who authored the comment is excluded from notifications.
  """

  require Logger

  alias Operately.Repo
  alias Operately.Projects.Notifications
  alias Operately.Projects.Milestone

  def dispatch(activity) do
    with {:ok, milestone} <- fetch_milestone(activity.content["milestone_id"]) do
      subscriber_ids = Notifications.get_milestone_subscribers(milestone)

      subscriber_ids
      |> Enum.uniq()
      |> Enum.filter(fn id -> id != activity.author_id end)
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
