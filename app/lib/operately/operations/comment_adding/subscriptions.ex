defmodule Operately.Operations.CommentAdding.Subscriptions do
  alias Ecto.Multi
  alias Operately.Notifications.SubscriptionList

  def update(multi, :discussion_comment_submitted, content), do: execute_update(multi, content)
  def update(multi, :goal_check_in_commented, content), do: execute_update(multi, content)
  def update(multi, :project_check_in_commented, content), do: execute_update(multi, content)
  def update(multi, :project_retrospective_commented, content), do: execute_update(multi, content)
  def update(multi, :comment_added, content), do: execute_update(multi, content)
  def update(multi, :resource_hub_document_commented, content), do: execute_update(multi, content)
  def update(multi, :resource_hub_file_commented, content), do: execute_update(multi, content)
  def update(multi, :resource_hub_link_commented, content), do: execute_update(multi, content)
  def update(multi, :project_task_commented, content), do: execute_update(multi, content)
  def update(multi, :space_task_commented, content), do: execute_update(multi, content)
  def update(multi, :kpi_entry_commented, content), do: execute_kpi_entry_update(multi, content)
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

  # KPI updates share the KPI's subscription list rather than carrying their own.
  defp execute_kpi_entry_update(multi, content) do
    multi
    |> Multi.run(:subscription_list, fn _, %{comment: comment} ->
      entry = Operately.Repo.get!(Operately.Kpis.KpiEntry, comment.entity_id)

      SubscriptionList.get(:system, parent_id: entry.kpi_id, opts: [
        preload: :subscriptions
      ])
    end)
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(content)
  end
end
