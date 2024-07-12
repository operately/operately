defmodule Operately.Operations.GoalCreation do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Goals.{Goal, Target}
  alias Operately.Activities
  alias Operately.Access
  alias Operately.Access.{Context, Binding}
  alias Operately.Companies.Company

  def run(creator, attrs) do
    Multi.new()
    |> insert_goal(creator, attrs)
    |> insert_context()
    |> insert_targets(attrs[:targets] || [])
    |> insert_bindings(creator, attrs)
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

  defp insert_context(multi) do
    Multi.insert(multi, :context, fn changes ->
      Context.changeset(%{
        goal_id: changes.goal.id,
      })
    end)
  end

  defp insert_bindings(multi, creator, attrs) do
    reviewer_group = Access.get_group!(person_id: attrs.reviewer_id)
    champion_group = Access.get_group!(person_id: attrs.champion_id)

    multi
    |> Access.insert_bindings_to_company(creator.company_id, attrs.company_access_level, attrs.anonymous_access_level)
    |> maybe_insert_bindings_to_space(creator, attrs)
    |> Access.insert_binding(:reviewer_binding, reviewer_group, Binding.full_access(), :reviewer)
    |> Access.insert_binding(:champion_binding, champion_group, Binding.full_access(), :champion)
  end

  defp maybe_insert_bindings_to_space(multi, creator, attrs) do
    company_space_id = Repo.one!(from(c in Company, where: c.id == ^creator.company_id, select: c.company_space_id))

    if attrs.space_id != company_space_id do
      Access.insert_bindings_to_space(multi, attrs.space_id, attrs.space_access_level)
    else
      multi
    end
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
