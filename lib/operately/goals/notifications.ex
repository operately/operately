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

      # members
      join: goal in assoc(u, :goal),
      join: context in assoc(goal, :access_context),
      join: space in assoc(goal, :group),
      join: person in assoc(space, :members),
      join: m in assoc(person, :access_group_memberships),
      join: g in assoc(m, :group),
      join: b in Binding, on: b.group_id == g.id and b.context_id == context.id and b.access_level >= ^Binding.view_access(),
      preload: [goal: {goal, group: {space, members: person}}],

      # subscriptions
      join: list in assoc(u, :subscription_list),
      join: subs in assoc(list, :subscriptions),
      join: sp in assoc(subs, :person),
      join: sm in assoc(sp, :access_group_memberships),
      join: sg in assoc(sm, :group),
      join: sb in Binding, on: sb.group_id == sg.id and sb.context_id == context.id and sb.access_level >= ^Binding.view_access(),
      preload: [subscription_list: {list, [subscriptions: subs]}]
    )
    |> Repo.one()
  end

  defp filter_subscribers(%{goal: g, subscription_list: l = %{send_to_everyone: true}}) do
    g.group.members
    |> maybe_add_missing_members(l.subscriptions)
    |> Enum.filter(fn p ->
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

  # If someone is not part of the space, they will not be present the members list
  # So, if they have a subscription, they have to be added to the members list manually
  defp maybe_add_missing_members(members, subscriptions) do
    people_ids = MapSet.new(Enum.map(members, & &1.id))

    missing_member_ids =
      subscriptions
      |> Enum.map(& &1.person_id)
      |> Enum.filter(fn person_id -> not MapSet.member?(people_ids, person_id) end)
      |> Enum.uniq()

    missing_members = Enum.map(missing_member_ids, fn id -> %{id: id} end)

    members ++ missing_members
  end
end
