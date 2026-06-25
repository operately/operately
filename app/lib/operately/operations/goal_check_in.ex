defmodule Operately.Operations.GoalCheckIn do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Goals.{Goal, Update, Target}
  alias Operately.Operations.Notifications.{Subscription, SubscriptionList}

  def run(author, goal, attrs) do
    targets = Operately.Goals.list_targets(goal.id)
    checklist = attrs.checklist
    target_values = attrs.target_values

    Multi.new()
    |> SubscriptionList.insert(attrs)
    |> Subscription.insert(author, attrs)
    |> Multi.insert(:update, fn changes ->
      changeset_attrs = %{
        goal_id: goal.id,
        author_id: author.id,
        status: attrs.status,
        message: attrs.content,
        state: state(attrs),
        subscription_list_id: changes.subscription_list.id
      }

      changeset_attrs = maybe_put_timeframe(changeset_attrs, goal, attrs)

      changeset_attrs =
        if target_values != nil do
          encoded_target_values = encode_new_target_values(targets, target_values)
          Map.put(changeset_attrs, :targets, encoded_target_values)
        else
          changeset_attrs
        end

      changeset_attrs =
        if checklist != nil do
          Map.put(changeset_attrs, :checks, checklist)
        else
          changeset_attrs
        end

      Update.changeset(changeset_attrs)
    end)
    |> SubscriptionList.update(:update)
    |> maybe_update_goal(goal, attrs)
    |> maybe_update_targets(targets, target_values, attrs)
    |> maybe_update_checklist(goal, checklist, attrs)
    |> maybe_record_activity(author, goal, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
    |> handle_result_broadcast()
  end

  defp maybe_update_goal(multi, _goal, %{post_as_draft: true}), do: multi

  defp maybe_update_goal(multi, goal, attrs) do
    Multi.update(multi, :goal, fn changes ->
      goal_attrs = %{
        next_update_scheduled_at: calc_next_check_in_time(goal),
        last_check_in_id: changes.update.id,
        last_update_status: changes.update.status
      }

      goal_attrs = maybe_put_timeframe(goal_attrs, goal, attrs)

      Goal.changeset(goal, goal_attrs)
    end)
  end

  defp maybe_update_targets(multi, _targets, _new_target_values, %{post_as_draft: true}), do: multi
  defp maybe_update_targets(multi, _targets, nil, _attrs), do: multi

  defp maybe_update_targets(multi, targets, new_target_values, _attrs) do
    Enum.reduce(new_target_values, multi, fn target_value, multi ->
      target = Enum.find(targets, fn target -> target.id == target_value["id"] end)
      changeset = Target.changeset(target, %{value: target_value["value"]})
      id = "target-#{target.id}"

      Multi.update(multi, id, changeset)
    end)
  end

  defp maybe_update_checklist(multi, _goal, _checklist, %{post_as_draft: true}), do: multi
  defp maybe_update_checklist(multi, _goal, nil, _attrs), do: multi

  defp maybe_update_checklist(multi, goal, checklist, _attrs) do
    checks = Operately.Repo.preload(goal, :checks).checks

    Enum.reduce(checklist, multi, fn item, multi ->
      check = Enum.find(checks, fn check -> check.id == item.id end)

      if check do
        changeset = Operately.Goals.Check.changeset(check, %{completed: item.completed, index: item.index})
        Multi.update(multi, "update-check-#{check.id}", changeset)
      else
        multi
      end
    end)
  end

  defp maybe_record_activity(multi, _author, _goal, %{post_as_draft: true}), do: multi

  defp maybe_record_activity(multi, author, goal, _attrs) do
    Activities.insert_sync(multi, author.id, :goal_check_in, fn changes ->
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
    if update.state == :published do
      OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: update.author_id)
    end

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

  defp state(%{post_as_draft: true}), do: :draft
  defp state(_attrs), do: :published

  defp calc_next_check_in_time(goal) do
    Operately.Time.calculate_next_monthly_check_in(goal.next_update_scheduled_at, DateTime.utc_now())
  end

  defp maybe_put_timeframe(attrs, goal, operation_attrs) do
    if Map.has_key?(operation_attrs, :due_date) do
      Map.put(attrs, :timeframe, to_timeframe(goal, operation_attrs.due_date))
    else
      attrs
    end
  end

  defp to_timeframe(_goal, nil), do: nil

  defp to_timeframe(goal, due_date) do
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
