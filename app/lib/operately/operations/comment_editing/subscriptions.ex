defmodule Operately.Operations.CommentEditing.Subscriptions do
  alias Ecto.Multi
  alias Operately.Notifications.SubscriptionList

  def update(multi, :project_check_in, content), do: execute_update(multi, content)
  def update(multi, :project_retrospective, content), do: execute_update(multi, content)
  def update(multi, :goal_update, content), do: execute_update(multi, content)
  def update(multi, :message, content), do: execute_update(multi, content)
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
