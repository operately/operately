defmodule Operately.Data.Change022CreateGoalBindings do
  alias Operately.Repo
  alias Operately.Goals
  alias Operately.Access
  alias Operately.Access.Binding

  def run do
    Repo.transaction(fn ->
      goals = Goals.list_goals()

      Enum.each(goals, fn goal ->
        context = Access.get_context!(goal_id: goal.id)

        create_bindings_to_people(context, goal)
        create_bindings_to_company(context, goal)
        create_bindings_to_space(context, goal)
      end)
    end)
  end

  defp create_bindings_to_people(context, goal) do
    champion_group = Access.get_group!(person_id: goal.champion_id)
    reviewer_group = Access.get_group!(person_id: goal.reviewer_id)

    create_binding(context, champion_group, Binding.full_access())
    create_binding(context, reviewer_group, Binding.full_access())
  end

  defp create_bindings_to_company(context, goal) do
    full_access = Access.get_group!(company_id: goal.company_id, tag: :full_access)
    standard = Access.get_group!(company_id: goal.company_id, tag: :standard)

    create_binding(context, full_access, Binding.full_access())
    create_binding(context, standard, Binding.edit_access())
  end

  defp create_bindings_to_space(context, goal) do
    full_access = Access.get_group!(group_id: goal.group_id, tag: :full_access)
    standard = Access.get_group!(group_id: goal.group_id, tag: :standard)

    create_binding(context, full_access, Binding.full_access())
    create_binding(context, standard, Binding.edit_access())
  end

  defp create_binding(context, group, access_level) do
    case Access.get_binding(context_id: context.id, group_id: group.id) do
      nil ->
        Access.create_binding(%{
          context_id: context.id,
          group_id: group.id,
          access_level: access_level,
        })
      _ ->
        :ok
    end
  end
end
