defmodule Operately.Activities.Notifications.ProjectMilestoneCommented do
  require Logger

  alias Operately.Notifications
  alias Operately.Notifications.SubscribersLoader
  alias Operately.Projects
  alias Operately.Projects.Milestone
  alias Operately.Repo

  def dispatch(activity) do
    with {:ok, milestone} <- fetch_milestone(activity.content["milestone_id"]) do
      mention_ids = fetch_mention_subscribers(milestone, ignore: [activity.author_id])

      watcher_ids =
        Projects.list_notification_subscribers(activity.content["project_id"],
          exclude: activity.author_id
        )
        |> Enum.map(& &1.id)

      (mention_ids ++ watcher_ids)
      |> Enum.uniq()
      |> Enum.map(fn person_id ->
        %{
          person_id: person_id,
          activity_id: activity.id,
          should_send_email: true
        }
      end)
      |> Notifications.bulk_create()
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

  defp fetch_mention_subscribers(%{subscription_list: nil}, _opts) do
    Logger.warning(
      "Skipping milestone comment notification dispatch because subscription list is missing"
    )

    []
  end

  defp fetch_mention_subscribers(milestone, opts) do
    ignore = Keyword.get(opts, :ignore, [])

    allowed_ids =
      SubscribersLoader.load_for_notifications(milestone, [], ignore)

    mention_ids =
      milestone.subscription_list.subscriptions
      |> Enum.reject(& &1.canceled)
      |> Enum.filter(&(&1.type == :mentioned))
      |> Enum.map(& &1.person_id)

    allowed_ids
    |> Enum.filter(&Enum.member?(mention_ids, &1))
  end
end
