defmodule Operately.Operations.GoalCheckIn do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Goals.{Goal, Update, Target}
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, goal, attrs) do
    targets = Operately.Goals.list_targets(goal.id)
    encoded_new_target_values = encode_new_target_values(targets, attrs.target_values)

    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Multi.insert(:update, fn changes ->
      Update.changeset(%{
        goal_id: goal.id,
        author_id: author.id,
        status: attrs.status,
        message: attrs.content,
        targets: encoded_new_target_values,
        subscription_list_id: changes.subscription_list.id,
        timeframe: to_timeframe(goal, attrs.due_date)
      })
    end)
    |> SubscriptionList.update(:update)
    |> update_goal(goal)
    |> update_targets(targets, attrs.target_values)
    |> record_activity(author, goal)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
    |> handle_result_broadcast()
  end

  defp update_goal(multi, goal) do
    Multi.update(multi, :goal, fn changes ->
      Goal.changeset(goal, %{
        next_update_scheduled_at: calc_next_check_in_time(goal),
        last_check_in_id: changes.update.id,
        last_update_status: changes.update.status,
        timeframe: changes.update.timeframe
      })
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
    |> Activities.insert_sync(author.id, :goal_check_in, fn changes ->
      %{
        company_id: goal.company_id,
        space_id: goal.group_id,
        goal_id: goal.id,
        update_id: changes.update.id
      }
    end)
  end

  defp handle_result_broadcast({:ok, update}) do
    OperatelyWeb.ApiSocket.broadcast!("api:assignments_count:#{update.author_id}")
    {:ok, update}
  end

  defp handle_result_broadcast(error), do: error

  #
  # Helpers
  #

  defp encode_new_target_values(targets, new_target_values) do
    Enum.map(new_target_values, fn target_value ->
      target = Enum.find(targets, fn target -> target.id == target_value["id"] end)

      Map.from_struct(target)
      |> Map.merge(%{
        value: target_value["value"],
        previous_value: target.value
      })
    end)
  end

  defp calc_next_check_in_time(goal) do
    Operately.Time.calculate_next_monthly_check_in(goal.next_update_scheduled_at, DateTime.utc_now())
  end

  defp to_timeframe(goal, due_date) do
    if due_date == nil do
      nil
    else
      %{
        type: "days",
        start_date: goal.inserted_at,
        end_date: due_date
      }
    end
  end
end
