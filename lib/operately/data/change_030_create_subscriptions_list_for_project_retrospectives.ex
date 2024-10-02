defmodule Operately.Data.Change030CreateSubscriptionsListForProjectRetrospectives do
  import Ecto.Query, only: [from: 2]

  alias Operately.{Repo, Notifications}
  alias Operately.Notifications.{Subscription, SubscriptionList}

  def run do
    Repo.transaction(fn ->
      Operately.Projects.Retrospective
      |> Repo.all()
      |> create_subscriptions_list()
      |> create_subscriptions()
    end)
  end

  defp create_subscriptions_list(retrospectives) when is_list(retrospectives) do
    Enum.map(retrospectives, fn r ->
      create_subscriptions_list(r)
    end)
  end

  defp create_subscriptions_list(retrospective) do
    case SubscriptionList.get(:system, parent_id: retrospective.id) do
      {:error, :not_found} ->
        {:ok, subscriptions_list} = Notifications.create_subscription_list(%{
          parent_id: retrospective.id,
          parent_type: :project_retrospective,
        })
        subscriptions_list

      {:ok, subscriptions_list} -> subscriptions_list
    end
    |> update_retrospective(retrospective)
  end

  defp update_retrospective(subscriptions_list, retrospective) do
    if subscriptions_list.id != retrospective.subscription_list_id do
      {:ok, _} = Operately.Projects.update_retrospective(retrospective, %{subscription_list_id: subscriptions_list.id})
    end
    subscriptions_list
  end

  defp create_subscriptions(subscriptions_list) when is_list(subscriptions_list) do
    Enum.map(subscriptions_list, fn list ->
      create_subscriptions(list)
    end)
  end

  defp create_subscriptions(subscriptions_list) do
    from(contrib in Operately.Projects.Contributor,
      join: p in assoc(contrib, :project),
      join: r in assoc(p, :retrospective),
      where: r.id == ^subscriptions_list.parent_id
    )
    |> Repo.all()
    |> Enum.map(fn contrib ->
      find_or_create_subscription(subscriptions_list, contrib)
    end)
  end

  defp find_or_create_subscription(subscriptions_list, contrib) do
    case Subscription.get(:system, subscription_list_id: subscriptions_list.id, person_id: contrib.person_id) do
      {:error, :not_found} ->
        {:ok, _} = Notifications.create_subscription(%{
          subscription_list_id: subscriptions_list.id,
          person_id: contrib.person_id,
          type: :invited,
        })
      _ -> :ok
    end
  end
end
