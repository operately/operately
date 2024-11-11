defmodule Operately.Data.Change029CreateSubscriptionsListForMessages do
  import Ecto.Query, only: [from: 2]

  alias Operately.{Repo, Notifications}
  alias Operately.Notifications.{Subscription, SubscriptionList}

  def run do
    Repo.transaction(fn ->
      from(m in Operately.Messages.Message, select: map(m, [:id, :subscription_list_id]))
      |> Repo.all()
      |> create_subscriptions_list()
      |> create_subscriptions()
    end)
  end

  defp create_subscriptions_list(messages) when is_list(messages) do
    Enum.map(messages, fn m ->
      create_subscriptions_list(m)
    end)
  end

  defp create_subscriptions_list(message) do
    case SubscriptionList.get(:system, parent_id: message.id) do
      {:error, :not_found} ->
        {:ok, subscriptions_list} = Notifications.create_subscription_list(%{
          parent_id: message.id,
          parent_type: :message,
        })
        subscriptions_list

      {:ok, subscriptions_list} -> subscriptions_list
    end
    |> update_message(message)
  end

  defp update_message(subscriptions_list, message) do
    if subscriptions_list.id != message.subscription_list_id do
      {:ok, _} = Operately.Messages.update_message(message, %{subscription_list_id: subscriptions_list.id})
    end
    subscriptions_list
  end

  defp create_subscriptions(subscriptions_list) when is_list(subscriptions_list) do
    Enum.map(subscriptions_list, fn list ->
      create_subscriptions(list)
    end)
  end

  defp create_subscriptions(subscriptions_list) do
    from(m in Operately.Messages.Message,
      join: s in assoc(m, :space),
      join: members in assoc(s, :members),
      where: m.subscription_list_id == ^subscriptions_list.id,
      select: members
    )
    |> Repo.all()
    |> Enum.map(fn p ->
      find_or_create_subscription(subscriptions_list, p)
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
