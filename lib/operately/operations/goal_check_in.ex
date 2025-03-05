defmodule Operately.Operations.GoalCheckIn do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Goals.{Goal, Update, Target, Timeframe}
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
        subscription_list_id: changes.subscription_list.id
      })
    end)
    |> SubscriptionList.update(:update)
    |> update_goal(goal, attrs[:timeframe])
    |> update_targets(targets, attrs.target_values)
    |> record_activity(author, goal)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
    |> handle_result_broadcast()
  end

  defp update_goal(multi, goal, timeframe) do
    next_check_in =
      Operately.Time.calculate_next_monthly_check_in(
        goal.next_update_scheduled_at,
        DateTime.utc_now()
      )

    changes = build_goal_changes(next_check_in, timeframe)

    Multi.update(multi, :goal, Goal.changeset(goal, changes))
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
      |> maybe_add_timeframes_to_activity(changes.goal.timeframe, goal.timeframe)
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

  defp maybe_add_timeframes_to_activity(content, nil, _), do: content

  defp maybe_add_timeframes_to_activity(content, new = %Timeframe{}, old = %Timeframe{}) do
    if timeframe_changed?(new, old) do
      Map.merge(content, %{
        new_timeframe: Map.from_struct(new),
        old_timeframe: Map.from_struct(old)
      })
    else
      content
    end
  end

  defp timeframe_changed?(new, old) do
    new.start_date != old.start_date or new.end_date != old.end_date
  end

  defp build_goal_changes(next_check_in, timeframe) do
    if timeframe do
      %{
        next_update_scheduled_at: next_check_in,
        timeframe: timeframe
      }
    else
      %{next_update_scheduled_at: next_check_in}
    end
  end
end
