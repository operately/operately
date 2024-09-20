defmodule Operately.Notifications.SubscribersLoader do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access.Binding

  @doc """
    Loads the IDs of people who should receive notifications for the given "resource".

    Parameters:
    - resource: struct which has a subscriptions list (e.g. message, project check-in, goal update).
      It must have `access_context` preloaded.

    - people: list of people who will be notified if resource.subscription_list.send_to_everyone == true.

    - ignore_ids: list of person IDs to exclude from the final result.
  """
  def load(resource, people, ignore_ids \\ []) do
    query = from(subs in Operately.Notifications.Subscription,
      join: p in assoc(subs, :person),
      join: m in assoc(p, :access_group_memberships),
      join: g in assoc(m, :group),
      join: b in Binding, on: b.group_id == g.id and b.context_id == ^resource.access_context.id and b.access_level >= ^Binding.view_access(),
      select: subs
    )

    resource
    |> Repo.preload(subscription_list: [subscriptions: query])
    |> filter_subscribers(people)
    |> Enum.uniq()
    |> Enum.filter(&(not Enum.member?(ignore_ids, &1)))
  end

  defp filter_subscribers(%{subscription_list: list = %{send_to_everyone: false}}, _) do
    Enum.filter(list.subscriptions, fn s -> not s.canceled end)
    |> Enum.map(&(&1.person_id))
  end

  defp filter_subscribers(%{subscription_list: list = %{send_to_everyone: true}}, people) do
    people
    |> maybe_add_missing_subscribers(list.subscriptions)
    |> Enum.filter(fn p ->
      case Enum.find(list.subscriptions, &(&1.person_id == p.id)) do
        nil -> true
        %{canceled: false} -> true
        _ -> false
      end
    end)
    |> Enum.map(&(&1.id))
  end

  # If for some reason someone is not part "people", but they have a subscription,
  # they have to be added to the subscriptions list manually
  defp maybe_add_missing_subscribers(people, subscriptions) do
    people_ids = MapSet.new(Enum.map(people, & &1.id))

    missing_member_ids =
      subscriptions
      |> Enum.map(& &1.person_id)
      |> Enum.filter(fn person_id -> not MapSet.member?(people_ids, person_id) end)

    missing_members = Enum.map(missing_member_ids, fn id -> %{id: id} end)

    people ++ missing_members
  end
end
