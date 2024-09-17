defmodule Operately.Operations.CommentAdding.Subscriptions do
  alias Ecto.Multi
  alias Operately.Notifications.SubscriptionList

  def update(multi, :project_check_in_commented, content), do: execute_update(multi, content)
  def update(multi, :goal_check_in_commented, content), do: execute_update(multi, content)
  def update(multi, _, _), do: multi

  defp execute_update(multi, content) do
    multi
    |> fetch_subscriptions()
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(content)
  end

  defp fetch_subscriptions(multi) do
    multi
    |> Multi.run(:subscription_list, fn _, %{comment: comment} ->
      SubscriptionList.get(:system, parent_id: comment.entity_id, opts: [
        preload: :subscriptions
      ])
    end)
  end
end
