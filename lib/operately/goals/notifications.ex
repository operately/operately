defmodule Operately.Goals.Notifications do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access.Binding

  def get_goal_update_subscribers(update_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])

    update_id
    |> fetch_update()
    |> filter_subscribers()
    |> Enum.filter(&(not Enum.member?(ignore, &1)))
  end

  #
  # Helpers
  #

  defp fetch_update(update_id) do
    from(u in Operately.Goals.Update,
      where: u.id == ^update_id,

      # subscriptions
      join: list in assoc(u, :subscription_list),
      join: subs in assoc(list, :subscriptions),
      preload: [subscription_list: {list, [subscriptions: subs]}],

      # permissions
      join: goal in assoc(u, :goal),
      join: context in assoc(goal, :access_context),
      join: space in assoc(goal, :group),
      join: person in assoc(space, :members),
      join: m in assoc(person, :access_group_memberships),
      join: g in assoc(m, :group),
      join: b in Binding, on: b.group_id == g.id and b.context_id == context.id and b.access_level >= ^Binding.view_access(),
      preload: [goal: {goal, group: {space, members: person}}]
    )
    |> Repo.one()
  end

  defp filter_subscribers(%{goal: g, subscription_list: l = %{send_to_everyone: true}}) do
    Enum.filter(g.group.members, fn p ->
      case Enum.find(l.subscriptions, &(&1.person_id == p.id)) do
        nil -> true
        %{canceled: false} -> true
        _ -> false
      end
    end)
    |> Enum.map(&(&1.id))
  end

  defp filter_subscribers(%{goal: g, subscription_list: l = %{send_to_everyone: false}}) do
    Enum.filter(l.subscriptions, fn s ->
      Enum.any?(g.group.members, &(&1.id == s.person_id))
    end)
    |> Enum.map(&(&1.person_id))
  end

  defp filter_subscribers(nil), do: []
end
