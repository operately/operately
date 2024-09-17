defmodule Operately.Operations.GoalCheckInEdit do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Goals.Target
  alias Operately.Goals.Update
  alias Operately.Notifications.SubscriptionList

  def run(author, goal, update, attrs) do
    encoded_new_target_values = encode_new_target_values(attrs.new_target_values, update)

    changeset = Update.changeset(update, %{
      message: attrs.content,
      targets: encoded_new_target_values,
    })

    Multi.new()
    |> Multi.update(:update, changeset)
    |> update_targets(goal.targets, attrs.new_target_values)
    |> Multi.run(:subscription_list, fn _, changes ->
      SubscriptionList.get(:system, parent_id: changes.update.id, opts: [
        preload: :subscriptions
      ])
    end)
    |> Operately.Operations.Notifications.Subscription.update_mentioned_people(attrs.content)
    |> record_activity(author, goal)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
  end

  defp encode_new_target_values(new_target_values, update) do
    Enum.map(new_target_values, fn target_value ->
      update.targets
      |> Enum.find(fn target -> target.id == target_value["id"] end)
      |> Map.merge(%{value: target_value["value"]})
      |> Map.from_struct()
    end)
  end

  defp update_targets(multi, targets, new_target_values) do
    Enum.reduce(new_target_values, multi, fn target_value, multi ->
      target = Enum.find(targets, fn target -> target.id == target_value["id"] end)
      changeset = Target.changeset(target, %{value: target_value["value"]})
      id = "target-#{target.id}"

      Multi.update(multi, id, changeset)
    end)
  end

  defp record_activity(multi, author, goal) do
    multi
    |> Activities.insert_sync(author.id, :goal_check_in_edit, fn changes -> %{
      company_id: goal.company_id,
      goal_id: goal.id,
      check_in_id: changes.update.id,
    } end)
  end
end
