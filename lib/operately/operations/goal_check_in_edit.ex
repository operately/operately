defmodule Operately.Operations.GoalCheckInEdit do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Goals.Target
  alias Operately.Updates.Update

  def run(author, goal, update, content, new_target_values) do
    targets = Operately.Goals.list_targets(goal.id)
    encoded_new_target_values = encode_new_target_values(new_target_values, update)

    changeset = Update.changeset(update, %{
      content: Operately.Updates.Types.GoalCheckIn.build(encoded_new_target_values, content),
    })

    Multi.new()
    |> Multi.update(:update, changeset)
    |> update_targets(targets, new_target_values)
    |> record_activity(author, goal)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
  end

  defp encode_new_target_values(new_target_values, update) do
    Enum.map(new_target_values, fn target_value -> 
      target = update.content["targets"] |> Enum.find(fn target -> target["id"] == target_value["id"] end)

      target |> Map.merge(%{value: target_value["value"]})
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
    |> Activities.insert(author.id, :goal_check_in_edit, fn changes -> %{
      company_id: goal.company_id,
      goal_id: goal.id,
      check_in_id: changes.update.id, 
    } end)
  end
end
