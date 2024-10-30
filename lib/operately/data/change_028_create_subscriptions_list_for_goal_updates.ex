defmodule Operately.Data.Change028CreateSubscriptionsListForGoalUpdates do
  import Ecto.Query, only: [from: 2]

  alias Operately.{Repo, Notifications}
  alias Operately.Notifications.{Subscription, SubscriptionList}

  def run do
    Repo.transaction(fn ->
      from(u in Operately.Goals.Update, select: %{id: u.id, subscription_list_id: u.subscription_list_id})
      |> Repo.all()
      |> create_subscriptions_list()
      |> create_subscriptions()
    end)
  end

  defp create_subscriptions_list(updates) when is_list(updates) do
    Enum.map(updates, fn u ->
      create_subscriptions_list(u)
    end)
  end

  defp create_subscriptions_list(update) do
    case SubscriptionList.get(:system, parent_id: update.id) do
      {:error, :not_found} ->
        {:ok, subscriptions_list} = Notifications.create_subscription_list(%{
          parent_id: update.id,
          parent_type: :goal_update,
        })
        subscriptions_list

      {:ok, subscriptions_list} -> subscriptions_list
    end
    |> edit_update(update)
  end

  defp edit_update(subscriptions_list, update) do
    {:ok, update_id} = Ecto.UUID.dump(update.id)
    {:ok, subscription_list_id} = Ecto.UUID.dump(subscriptions_list.id)

    {_, nil} = from(u in "goal_updates", where: u.id == ^update_id)
    |> Repo.update_all(set: [
      subscription_list_id: subscription_list_id
    ])

    subscriptions_list
  end

  defp create_subscriptions(subscriptions_list) when is_list(subscriptions_list) do
    Enum.map(subscriptions_list, fn list ->
      create_subscriptions(list)
    end)
  end

  defp create_subscriptions(subscriptions_list) do
    from(u in Operately.Goals.Update,
      join: g in assoc(u, :goal),
      join: c in assoc(g, :champion),
      join: r in assoc(g, :reviewer),
      where: u.id == ^subscriptions_list.parent_id,
      select: {c, r}
    )
    |> Repo.all()
    |> Enum.map(fn {champion, reviewer} ->
      find_or_create_subscription(subscriptions_list, champion)
      find_or_create_subscription(subscriptions_list, reviewer)
    end)
  end

  defp find_or_create_subscription(subscriptions_list, person) do
    case Subscription.get(:system, subscription_list_id: subscriptions_list.id, person_id: person.id) do
      {:error, :not_found} ->
        {:ok, _} = Notifications.create_subscription(%{
          subscription_list_id: subscriptions_list.id,
          person_id: person.id,
          type: :invited,
        })
      _ ->
        :ok
    end
  end
end
