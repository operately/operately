defmodule Operately.Data.Chenge027CreateSubscriptionsListForCheckIns do
  import Ecto.Query, only: [from: 1, from: 2]

  alias Operately.{Repo, Notifications}
  alias Operately.Notifications.Subscription
  alias Operately.Projects.{CheckIn, Contributor}

  def run do
    Repo.transaction(fn ->
      from(c in CheckIn)
      |> Repo.all()
      |> create_subscriptions_list()
      |> create_subscriptions()
    end)
  end

  defp create_subscriptions_list(check_ins) when is_list(check_ins) do
    Enum.map(check_ins, fn c ->
      create_subscriptions_list(c)
    end)
  end

  defp create_subscriptions_list(check_in) do
    case Notifications.get_subscription_list(parent_id: check_in.id) do
      nil ->
        {:ok, subscriptions_list} = Notifications.create_subscription_list(%{
          parent_id: check_in.id,
          parent_type: :project_check_in,
          send_to_everyone: true,
        })
        subscriptions_list

      subscriptions_list -> subscriptions_list
    end
  end

  defp create_subscriptions(subscriptions_list) when is_list(subscriptions_list) do
    Enum.map(subscriptions_list, fn list ->
      create_subscriptions(list)
    end)
  end

  defp create_subscriptions(subscriptions_list) do
    from(contrib in Contributor,
      join: p in assoc(contrib, :project),
      join: c in assoc(p, :check_ins),
      where: c.id == ^subscriptions_list.parent_id
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
