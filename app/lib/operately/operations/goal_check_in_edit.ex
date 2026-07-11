defmodule Operately.Operations.GoalCheckInEdit do
  alias Ecto.Multi
  alias Operately.{Repo, Activities, Time}
  alias Operately.Drafts
  alias Operately.Goals.{Goal, Update, Target}
  alias Operately.Notifications.SubscriptionList

  def run(author, goal, check_in, attrs) do
    Multi.new()
    |> set_if_full_edit_allowed(goal, check_in)
    |> update_check_in(check_in, attrs)
    |> maybe_update_targets(goal.targets, attrs.new_target_values)
    |> maybe_update_checks(goal.checks, attrs.checklist || [])
    |> update_subscriptions(attrs.content)
    |> maybe_update_goal(goal, attrs)
    |> record_activity(author, goal, check_in)
    |> handle_oban_jobs(check_in, attrs)
    |> Repo.transaction()
    |> Repo.extract_result(:check_in)
    |> broadcast_if_published(author)
  end

  #
  # Edits to the status, timeframe, and targets are allowed within 3 days of the
  # check-in being created and only if it is the latest check-in.
  # Otherwise, only the message can be edited.
  #
  defp set_if_full_edit_allowed(multi, goal, check_in) do
    edit_start = Drafts.display_date(check_in)
    edit_deadline = DateTime.add(edit_start, 3, :day)

    is_latest = goal.last_check_in_id == check_in.id
    is_in_edit_deadline = DateTime.compare(Time.utc_datetime_now(), edit_deadline) == :lt

    Multi.put(multi, :full_edit_allowed, check_in.state in [:draft, :scheduled] or (is_latest and is_in_edit_deadline))
  end

  defp update_check_in(multi, check_in, attrs) do
    Multi.update(multi, :check_in, fn changes ->
      if changes.full_edit_allowed do
        Update.changeset(check_in, %{
          status: attrs.status,
          message: attrs.content,
          state: state(check_in, attrs),
          scheduled_at: scheduled_at(check_in, attrs),
          targets: encode_new_target_values(attrs.new_target_values, check_in),
          checks: attrs.checklist,
          timeframe: to_timeframe(check_in.goal, attrs[:due_date])
        })
      else
        Update.changeset(check_in, %{
          message: attrs.content,
          state: state(check_in, attrs)
        })
      end
    end)
  end

  defp maybe_update_targets(multi, targets, new_target_values) do
    Multi.merge(multi, fn changes ->
      if changes.full_edit_allowed and changes.check_in.state == :published do
        update_targets(targets, new_target_values)
      else
        # no-op
        Multi.new()
      end
    end)
  end

  defp update_targets(targets, new_target_values) do
    Enum.reduce(new_target_values, Multi.new(), fn target_value, multi ->
      target = Enum.find(targets, fn target -> target.id == target_value["id"] end)
      changeset = Target.changeset(target, %{value: target_value["value"]})
      id = "target-#{target.id}"

      Multi.update(multi, id, changeset)
    end)
  end

  defp maybe_update_checks(multi, checks, checklist) do
    Multi.merge(multi, fn changes ->
      if changes.full_edit_allowed and changes.check_in.state == :published do
        update_checks(checks, checklist)
      else
        # no-op
        Multi.new()
      end
    end)
  end

  defp update_checks(checks, checklist) do
    Enum.reduce(checklist, Multi.new(), fn item, multi ->
      check = Enum.find(checks, fn check -> check.id == item.id end)

      if check do
        changeset = Operately.Goals.Check.changeset(check, %{completed: item.completed, index: item.index})
        Multi.update(multi, "update-check-#{check.id}", changeset)
      else
        # no-op for new checks
        multi
      end
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

  defp maybe_update_goal(multi, goal, attrs) do
    Multi.update(multi, :goal, fn changes ->
      cond do
        changes.check_in.state in [:draft, :scheduled] ->
          Goal.changeset(goal, %{})

        changes.full_edit_allowed and changes.check_in.state == :published ->
          Goal.changeset(goal, %{timeframe: to_timeframe(goal, attrs[:due_date]), last_check_in_id: changes.check_in.id, last_update_status: changes.check_in.status})

        true ->
          Goal.changeset(goal, %{})
      end
    end)
  end

  defp record_activity(multi, author, goal, check_in) do
    Multi.merge(multi, fn changes ->
      cond do
        check_in.state in [:draft, :scheduled] and changes.check_in.state in [:draft, :scheduled] ->
          Multi.new()

        check_in.state in [:draft, :scheduled] and changes.check_in.state == :published ->
          Activities.insert_sync(Multi.new(), author.id, :goal_check_in, fn _ ->
            %{
              company_id: goal.company_id,
              space_id: goal.group_id,
              goal_id: goal.id,
              update_id: changes.check_in.id,
              old_timeframe: goal.timeframe,
              new_timeframe: changes.check_in.timeframe
            }
          end)

        true ->
          Activities.insert_sync(Multi.new(), author.id, :goal_check_in_edit, fn _ ->
            old_timeframe = check_in.timeframe
            new_timeframe = changes.check_in.timeframe

            %{
              company_id: goal.company_id,
              goal_id: goal.id,
              check_in_id: changes.check_in.id,
              old_timeframe: old_timeframe,
              new_timeframe: new_timeframe
            }
          end)
      end
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

  defp state(check_in, attrs) do
    cond do
      not is_nil(attrs[:state]) -> attrs[:state]
      not is_nil(attrs[:scheduled_at]) -> :scheduled
      true -> check_in.state
    end
  end

  defp scheduled_at(check_in, attrs) do
    cond do
      not is_nil(attrs[:scheduled_at]) -> attrs[:scheduled_at]
      attrs[:state] in [:draft, :published] -> nil
      true -> check_in.scheduled_at
    end
  end

  defp handle_oban_jobs(multi, check_in, attrs) do
    new_state = state(check_in, attrs)
    new_time = scheduled_at(check_in, attrs)

    if check_in.state == :scheduled or new_state == :scheduled do
      multi
      |> Multi.delete_all(:delete_oban_job, fn _ ->
        import Ecto.Query

        from j in Oban.Job,
          where: j.worker == "Operately.AsyncPublishing.Worker",
          where: fragment("args->>'type' = ?", "goal_update"),
          where: fragment("args->>'id' = ?", ^check_in.id)
      end)
      |> Multi.run(:insert_oban_job, fn _repo, changes ->
        if new_state == :scheduled and not is_nil(new_time) do
          Operately.AsyncPublishing.Worker.new(
            %{"type" => "goal_update", "id" => changes.check_in.id},
            scheduled_at: new_time
          )
          |> Oban.insert()
        else
          {:ok, nil}
        end
      end)
    else
      multi
    end
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
        contextual_start_date: contextual_start_date,
        contextual_end_date: due_date
      }
    end
  end

  defp broadcast_if_published({:ok, check_in}, author) do
    if check_in.state == :published do
      OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: author.id)
    end

    {:ok, check_in}
  end

  defp broadcast_if_published(error, _author), do: error
end
