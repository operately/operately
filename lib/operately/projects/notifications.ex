defmodule Operately.Projects.Notifications do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access.Binding

  def get_check_in_subscribers(check_in_id, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])

    check_in_id
    |> fetch_check_in()
    |> filter_subscribers()
    |> Enum.map(&(&1.person_id))
    |> Enum.filter(&(not Enum.member?(ignore, &1)))
  end

  #
  # Helpers
  #

  defp fetch_check_in(check_in_id) do
    from(c in Operately.Projects.CheckIn,
      where: c.id == ^check_in_id,

      # subscriptions
      join: list in assoc(c, :subscription_list),
      join: subs in assoc(list, :subscriptions),
      preload: [subscription_list: {list, [subscriptions: subs]}],

      # permissions
      join: project in assoc(c, :project),
      join: context in assoc(project, :access_context),
      join: contribs in assoc(project, :contributors),
      join: person in assoc(contribs, :person),
      join: m in assoc(person, :access_group_memberships),
      join: g in assoc(m, :group),
      join: b in Binding, on: b.group_id == g.id and b.context_id == context.id and b.access_level >= ^Binding.view_access(),
      preload: [project: {project, [contributors: contribs]}]
    )
    |> Repo.one()
  end

  defp filter_subscribers(%{project: p, subscription_list: l = %{send_to_everyone: true}}) do
    Enum.filter(p.contributors, fn c ->
      case Enum.find(l.subscriptions, &(&1.person_id == c.person_id)) do
        nil -> true
        %{canceled: false} -> true
        _ -> false
      end
    end)
  end

  defp filter_subscribers(%{project: p, subscription_list: l = %{send_to_everyone: false}}) do
    Enum.filter(l.subscriptions, fn s ->
      Enum.any?(p.contributors, &(&1.person_id == s.person_id))
    end)
  end

  defp filter_subscribers(nil), do: []
end
