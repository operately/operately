defmodule Operately.Operations.GoalCheckIn do
  def run(author, goal, new_target_values, content) do
    action = :goal_check_in

    changeset = Update.changeset(%{
      updatable_type: :goal,
      updatable_id: goal.id,
      author_id: author.id,
      title: "",
      type: :goal_check_in,
      content: Operately.Updates.Types.GoalCheckIn.build(new_target_values, content),
    })

    next_check_in = Operately.Time.calculate_next_check_in(goal.next_update_scheduled_at, DateTime.utc_now())

    Multi.new()
    |> Multi.insert(:update, changeset)
    |> Multi.update(:goal, Goal.changeset(goal, %{next_update_scheduled_at: next_check_in}))
    |> Enum.reduce(new_target_values, fn target_value, multi ->
      target = Operational.Goals.get_target(target_value.id)
      changeset = Target.changeset(target, %{value: target_value.value})

      Multi.update(multi, :target, changeset)
    end)
    |> Activities.insert(author.id, action, fn changes -> %{
      company_id: goal.company_id,
      goal_id: goal.id,
      update_id: changes.update.id, 
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
  end
end
