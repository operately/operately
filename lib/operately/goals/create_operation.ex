defmodule Operately.Goals.CreateOperation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Goals.{Goal, Target}
  alias Operately.Groups
  alias Operately.Activities

  def run(creator, attrs) do
    group = Groups.get_group!(attrs[:space_id])

    changeset = Goal.changeset(%{
      name: attrs[:name],
      company_id: group.company_id,
      group_id: attrs[:space_id],
      champion_id: attrs[:champion_id],
      reviewer_id: attrs[:reviewer_id],
      timeframe: attrs[:timeframe],
      creator_id: creator.id,
    })

    Multi.new()
    |> Multi.insert(:goal, changeset)
    |> insert_targets(attrs[:targets] || [])
    |> Activities.insert(creator.id, :goal_created, fn changes -> %{
      company_id: group.company_id,
      space_id: group.id,
      goal_id: changes.goal.id,
      goal_name: changes.goal.name,
      champion_id: changes.goal.champion_id,
      reviewer_id: changes.goal.reviewer_id,
      creator_id: changes.goal.creator_id,
      timeframe: changes.goal.timeframe,
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
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
