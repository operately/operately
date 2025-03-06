defmodule Operately.Operations.GoalCheckInEdit do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Goals.{Goal, Update, Target}
  alias Operately.Notifications.SubscriptionList

  def run(author, goal, check_in, attrs) do
    Multi.new()
    |> update_check_in(check_in, attrs)
    |> update_targets(goal.targets, attrs.new_target_values)
    |> update_subscriptions(attrs.content)
    |> maybe_update_goal(goal, attrs[:timeframe])
    |> record_activity(author, goal)
    |> Repo.transaction()
    |> Repo.extract_result(:check_in)
  end

  defp update_check_in(multi, check_in, attrs) do
    encoded_new_target_values = encode_new_target_values(attrs.new_target_values, check_in)

    multi
    |> Multi.update(
      :check_in,
      Update.changeset(check_in, %{
        status: attrs.status,
        message: attrs.content,
        targets: encoded_new_target_values
      })
    )
  end

  defp update_targets(multi, targets, new_target_values) do
    Enum.reduce(new_target_values, multi, fn target_value, multi ->
      target = Enum.find(targets, fn target -> target.id == target_value["id"] end)
      changeset = Target.changeset(target, %{value: target_value["value"]})
      id = "target-#{target.id}"

      Multi.update(multi, id, changeset)
    end)
  end

  defp update_subscriptions(multi, content) do
    multi
    |> Multi.run(:subscription_list, fn _, changes ->
      SubscriptionList.get(:system,
        parent_id: changes.check_in.id,
        opts: [
          preload: :subscriptions
        ]
      )
    end)
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(content)
  end

  defp maybe_update_goal(multi, _, nil), do: multi

  defp maybe_update_goal(multi, goal, timeframe) do
    if timeframe_changed?(goal.timeframe, timeframe) do
      multi
      |> Multi.update(:goal, Goal.changeset(goal, %{timeframe: timeframe}))
    else
      multi
    end
  end

  defp record_activity(multi, author, goal) do
    multi
    |> Activities.insert_sync(author.id, :goal_check_in_edit, fn changes ->
      %{
        company_id: goal.company_id,
        goal_id: goal.id,
        check_in_id: changes.check_in.id
      }
    end)
  end

  #
  # Helpers
  #

  defp encode_new_target_values(new_target_values, check_in) do
    Enum.map(new_target_values, fn target_value ->
      check_in.targets
      |> Enum.find(fn target -> target.id == target_value["id"] end)
      |> Map.merge(%{value: target_value["value"]})
      |> Map.from_struct()
    end)
  end

  defp timeframe_changed?(new, old) do
    new.start_date != old.start_date or new.end_date != old.end_date
  end
end
