defmodule Operately.Operations.GoalCheckIn do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Goals.{Goal, Update, Target}
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, goal, attrs) do
    targets = Operately.Goals.list_targets(goal.id)
    checklist = attrs.checklist || []
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
    |> update_goal(goal, attrs)
    |> update_targets(targets, attrs.target_values)
    |> update_checklist(checklist)
    |> record_activity(author, goal)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
    |> handle_result_broadcast()
  end

  defp update_goal(multi, goal, attrs) do
    Multi.update(multi, :goal, fn changes ->
      Goal.changeset(goal, %{
        next_update_scheduled_at: calc_next_check_in_time(goal),
        last_check_in_id: changes.update.id,
        last_update_status: changes.update.status,
        timeframe: to_timeframe(goal, attrs.due_date)
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

  defp update_checklist(multi, checklist) do
    Enum.reduce(checklist, multi, fn item, multi ->
      check = Operately.Repo.one(Operately.Goals.Check, item.id)

      if check do
        changeset = Operately.Goals.Check.changeset(check, %{completed: item.completed, index: item.index})
        Multi.insert(multi, {:check, item.id}, changeset)
      else
        multi
      end
    end)
  end

  defp record_activity(multi, author, goal) do
    multi
    |> Activities.insert_sync(author.id, :goal_check_in, fn changes ->
      old_timeframe = goal.timeframe
      new_timeframe = changes.update.timeframe

      %{
        company_id: goal.company_id,
        space_id: goal.group_id,
        goal_id: goal.id,
        update_id: changes.update.id,
        old_timeframe: old_timeframe,
        new_timeframe: new_timeframe
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
      contextual_start_date = %{
        date_type: :day,
        value: Calendar.strftime(goal.inserted_at, "%b %d, %Y"),
        date: goal.inserted_at
      }

      %{
        type: "days",
        start_date: goal.inserted_at,
        end_date: due_date.date,
        contextual_start_date: contextual_start_date,
        contextual_end_date: due_date
      }
    end
  end
end
