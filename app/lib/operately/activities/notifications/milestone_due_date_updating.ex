defmodule Operately.Activities.Notifications.MilestoneDueDateUpdating do
  @moduledoc """
  Notifies the following people:
  - People subscribed to the milestone

  The author of the activity is excluded from notifications.
  """

  require Logger
  alias Operately.Projects.Notifications

  def dispatch(activity) do
    {:ok, milestone} = fetch_milestone(activity.content["milestone_id"])
    milestone_subscribers = Notifications.get_milestone_subscribers(milestone, ignore: [activity.author_id])

    milestone_subscribers
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

  defp fetch_milestone(milestone_id) do
    case Operately.Projects.Milestone.get(:system, id: milestone_id, opts: [preload: [:project]]) do
      {:ok, milestone} ->
        {:ok, milestone}

      {:error, reason} ->
        Logger.warning(
          "Unable to load milestone #{milestone_id} for due date update notifications: #{inspect(reason)}"
        )

        {:error, reason}
    end
  end
end
