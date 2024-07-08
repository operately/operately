defmodule Operately.Operations.GoalEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Activities
  alias Operately.Goals.{Goal, Target}

  def run(author, goal, attrs) do
    targets = Repo.preload(goal, :targets).targets

    Multi.new()
    |> update_goal(goal, attrs)
    |> update_targets(goal, targets, attrs)
    |> fetch_context()
    |> update_bindings(goal, attrs)
    |> insert_activity(author, goal, targets)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end

  defp update_goal(multi, goal, attrs) do
    changeset = Goal.changeset(goal, %{
      name: attrs.name,
      champion_id: attrs.champion_id,
      reviewer_id: attrs.reviewer_id,
      timeframe: attrs.timeframe,
      description: attrs[:description] && Jason.decode!(attrs.description),
    })

    Multi.update(multi, :goal, changeset)
  end

  defp update_targets(multi, goal, targets, attrs) do
    multi = Enum.reduce(attrs.updated_targets, multi, fn target_attrs, multi ->
      target = Enum.find(targets, fn target -> target.id == target_attrs.id end)
      changeset = Target.changeset(target, target_attrs)

      Multi.update(multi, "updated_target_#{target.id}", changeset)
    end)

    multi = Enum.reduce(attrs.added_targets, multi, fn target_attrs, multi ->
      attrs = Map.merge(target_attrs, %{goal_id: goal.id, value: target_attrs.from})
      changeset = Target.changeset(%Target{}, attrs)

      Multi.insert(multi, "added_target_#{target_attrs.index}", changeset)
    end)

    multi = Enum.reduce(targets, multi, fn target, multi ->
      if Enum.find(attrs.updated_targets, fn t -> target.id == t.id end) do
        multi
      else
        Multi.delete(multi, "deleted_target_#{target.id}", target)
      end
    end)

    multi
  end

  defp fetch_context(multi) do
    multi
    |> Multi.run(:context, fn _, changes ->
      {:ok, Access.get_context!(goal_id: changes.goal.id)}
    end)
  end

  defp update_bindings(multi, goal, attrs) do
    multi
    |> Access.update_bindings_to_company(goal.company_id, attrs.company_access_level, attrs.anonymous_access_level)
    |> Access.update_bindings_to_space(goal.group_id, attrs.space_access_level)
  end

  defp insert_activity(multi, author, goal, targets) do
    Activities.insert_sync(multi, author.id, :goal_editing, fn changes ->
      %{
        company_id: goal.company_id,
        goal_id: changes.goal.id,
        old_name: goal.name,
        new_name: changes.goal.name,
        old_champion_id: goal.champion_id,
        new_champion_id: changes.goal.champion_id,
        old_reviewer_id: goal.reviewer_id,
        new_reviewer_id: changes.goal.reviewer_id,
        previous_timeframe: Map.from_struct(goal.timeframe),
        current_timeframe: Map.from_struct(changes.goal.timeframe),
        added_targets: serialize_added_targets(changes),
        updated_targets: serialize_updated_targets(targets, changes),
        deleted_targets: serialize_deleted_targets(changes),
      }
    end)
  end

  defp serialize_added_targets(changes) do
    changes
    |> Enum.filter(fn {key, _} -> is_binary(key) && String.starts_with?(key, "added_target_") end)
    |> Enum.map(fn {_, target} -> %{
      id: target.id,
      name: target.name,
      from: target.from,
      to: target.to,
      unit: target.unit,
      index: target.index,
    } end)
  end

  defp serialize_updated_targets(targets, changes) do
    changes
    |> Enum.filter(fn {key, _} -> is_binary(key) && String.starts_with?(key, "updated_target_") end)
    |> Enum.map(fn {_, target} ->
      old = Enum.find(targets, fn t -> t.id == target.id end)

      %{
        id: target.id,
        old_name: old.name,
        new_name: target.name,
        old_from: old.from,
        new_from: target.from,
        old_to: old.to,
        new_to: target.to,
        old_unit: old.unit,
        new_unit: target.unit,
        old_index: old.index,
        new_index: target.index,
      }
    end)
  end

  defp serialize_deleted_targets(changes) do
    changes
    |> Enum.filter(fn {key, _} -> is_binary(key) && String.starts_with?(key, "deleted_target_") end)
    |> Enum.map(fn {_, target} ->
      %{
        id: target.id,
        name: target.name,
        from: target.from,
        to: target.to,
        unit: target.unit,
        index: target.index,
      }
    end)
  end
end
