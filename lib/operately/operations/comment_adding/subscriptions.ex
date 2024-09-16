defmodule Operately.Operations.CommentAdding.Subscriptions do
  alias Ecto.Multi
  alias Operately.{Notifications, RichContent}
  alias Operately.Notifications.SubscriptionList

  def update(multi, :project_check_in_commented, content), do: execute_update(multi, content)
  def update(multi, :goal_check_in_commented, content), do: execute_update(multi, content)
  def update(multi, _, _), do: multi

  defp execute_update(multi, content) do
    multi
    |> fetch_subscriptions()
    |> update_subscriptions(content)
  end

  defp fetch_subscriptions(multi) do
    multi
    |> Multi.run(:subscription_list, fn _, %{comment: comment} ->
      SubscriptionList.get(:system, parent_id: comment.entity_id, opts: [
        preload: :subscriptions
      ])
    end)
  end

  defp update_subscriptions(multi, content) do
    ids = RichContent.find_mentioned_ids(content, :decode_ids)

    Enum.reduce(ids, multi, fn id, multi ->
      name = "subscription_" <> id

      Multi.run(multi, name, fn _, changes ->
        if subscription_exists?(changes, id) do
          {:ok, nil}
        else
          Notifications.create_subscription(%{
            subscription_list_id: changes.subscription_list.id,
            person_id: id,
            type: :mentioned,
          })
        end
      end)
    end)
  end

  #
  # Helpers
  #

  defp subscription_exists?(changes, id) do
    Enum.any?(changes.subscription_list.subscriptions, &(&1.person_id == id))
  end
end
