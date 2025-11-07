defmodule Operately.Operations.CommentAdding.Subscriptions do
  alias Ecto.Multi
  alias Operately.Notifications.SubscriptionList

  def update(multi, :discussion_comment_submitted, content, subscriber_ids), do: execute_update(multi, content, subscriber_ids)
  def update(multi, :goal_check_in_commented, content, subscriber_ids), do: execute_update(multi, content, subscriber_ids)
  def update(multi, :project_check_in_commented, content, subscriber_ids), do: execute_update(multi, content, subscriber_ids)
  def update(multi, :project_retrospective_commented, content, subscriber_ids), do: execute_update(multi, content, subscriber_ids)
  def update(multi, :comment_added, content, subscriber_ids), do: execute_update(multi, content, subscriber_ids)
  def update(multi, :resource_hub_document_commented, content, subscriber_ids), do: execute_update(multi, content, subscriber_ids)
  def update(multi, :resource_hub_file_commented, content, subscriber_ids), do: execute_update(multi, content, subscriber_ids)
  def update(multi, :resource_hub_link_commented, content, subscriber_ids), do: execute_update(multi, content, subscriber_ids)
  def update(multi, :project_task_commented, content, subscriber_ids), do: execute_update(multi, content, subscriber_ids)
  def update(multi, _, _, _), do: multi

  defp execute_update(multi, content, subscriber_ids) do
    multi
    |> fetch_subscriptions()
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(content)
    |> Operately.Operations.Notifications.Subscription.update_invited_people(subscriber_ids)
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
