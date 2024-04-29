defmodule Operately.Operations.GoalCreation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Goals.{Goal, Target}
  alias Operately.Activities

  def run(creator, attrs) do
    Multi.new()
    |> insert_goal(creator, attrs)
    |> insert_targets(attrs[:targets] || [])
    |> insert_activity(creator)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end

  defp insert_goal(multi, creator, attrs) do
    Multi.insert(multi, :goal, Goal.changeset(%{
      name: attrs[:name],
      company_id: creator.company_id,
      group_id: attrs[:space_id],
      champion_id: attrs[:champion_id],
      reviewer_id: attrs[:reviewer_id],
      timeframe: attrs[:timeframe],
      parent_goal_id: attrs[:parent_goal_id],
      description: attrs[:description] && Jason.decode!(attrs[:description]),
      creator_id: creator.id,
      next_update_scheduled_at: Operately.Time.first_friday_from_today(),
    }))
  end

  defp insert_activity(multi, creator) do
    Activities.insert_sync(multi, creator.id, :goal_created, fn changes ->
      %{
        company_id: changes.goal.company_id,
        space_id: changes.goal.group_id,
        goal_id: changes.goal.id,
        goal_name: changes.goal.name,
        champion_id: changes.goal.champion_id,
        reviewer_id: changes.goal.reviewer_id,
        creator_id: changes.goal.creator_id,
        new_timeframe: Map.from_struct(changes.goal.timeframe),
      }
    end)
  end

  defp insert_targets(multi, targets) do
    targets
    |> Enum.with_index()
    |> Enum.reduce(multi, fn {target, index}, multi ->
      Multi.insert(multi, :"target_#{index}", fn %{goal: goal} ->
        Target.changeset(%{
          goal_id: goal.id,
          name: target[:name],
          from: target[:from],
          to: target[:to],
          value: target[:from],
          unit: target[:unit],
          index: index,
        })
      end)
    end)
  end
end
