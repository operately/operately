defmodule Operately.Operations.GoalCheckInEdit do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Goals.{Goal, Update, Target}
  alias Operately.Notifications.SubscriptionList

  def run(author, goal, check_in, attrs) do
    Multi.new()
    |> set_if_full_edit_allowed(goal, check_in)
    |> update_check_in(check_in, attrs)
    |> maybe_update_targets(goal.targets, attrs.new_target_values)
    |> update_subscriptions(attrs.content)
    |> maybe_update_goal(goal)
    |> record_activity(author, goal)
    |> Repo.transaction()
    |> Repo.extract_result(:check_in)
  end

  #
  # Edits to the status, timeframe, and targets are allowed within 3 days of the
  # check-in being created and only if it is the latest check-in.
  # Otherwise, only the message can be edited.
  #
  defp set_if_full_edit_allowed(multi, goal, check_in) do
    edit_deadline = NaiveDateTime.add(check_in.inserted_at, 3, :day)

    is_latest = goal.last_check_in_id == check_in.id
    is_in_edit_deadline = NaiveDateTime.compare(NaiveDateTime.utc_now(), edit_deadline) == :lt

    Multi.put(multi, :full_edit_allowed, is_latest and is_in_edit_deadline)
  end

  defp update_check_in(multi, check_in, attrs) do
    Multi.update(multi, :check_in, fn changes ->
      if changes.full_edit_allowed do
        Update.changeset(check_in, %{
          status: attrs.status,
          message: attrs.content,
          targets: encode_new_target_values(attrs.new_target_values, check_in),
          timeframe: attrs[:timeframe] || check_in.timeframe
        })
      else
        Update.changeset(check_in, %{
          message: attrs.content
        })
      end
    end)
  end

  defp maybe_update_targets(multi, targets, new_target_values) do
    Multi.merge(multi, fn changes ->
      if changes.full_edit_allowed do
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

  defp maybe_update_goal(multi, goal) do
    Multi.update(multi, :goal, fn changes ->
      if changes.full_edit_allowed do
        Goal.changeset(goal, %{timeframe: changes.check_in.timeframe, last_update_status: changes.check_in.status})
      else
        Goal.changeset(goal, %{})
      end
    end)
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
end
