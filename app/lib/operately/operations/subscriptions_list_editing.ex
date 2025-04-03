defmodule Operately.Operations.SubscriptionsListEditing do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Notifications
  alias Operately.Notifications.{Subscription, SubscriptionList}

  def run(subscription_list, attrs) do
    Multi.new()
    |> Multi.run(:subscriptions, fn _, _ ->
      {:ok, Notifications.list_subscriptions(subscription_list)}
    end)
    |> update_subscription_list(subscription_list, attrs[:send_notifications_to_everyone])
    |> insert_subscriptions(attrs.subscriber_ids)
    |> cancel_subscriptions(attrs.subscriber_ids)
    |> Repo.transaction()
  end

  defp update_subscription_list(multi, _, nil), do: multi
  defp update_subscription_list(multi, subscription_list, send_to_everyone) do
    multi
    |> Multi.update(:subscription_list, SubscriptionList.changeset(subscription_list, %{
      send_to_everyone: send_to_everyone,
    }))
  end

  defp insert_subscriptions(multi, subscriber_ids) do
    Enum.reduce(subscriber_ids, multi, fn id, multi ->
      name = "subscription_" <> id

      Multi.run(multi, name, fn _, changes ->
        if subscription_active?(changes, id) do
          {:ok, nil}
        else
          create_or_update_subscription(changes, id)
        end
      end)
    end)
  end

  defp cancel_subscriptions(multi, subscriber_ids) do
    multi
    |> Multi.update_all(:canceled_subscriptions, fn changes ->
      ids = find_subscriptions_to_cancel(changes, subscriber_ids)

      from(s in Subscription,
        where: s.subscription_list_id == ^changes.subscription_list.id and s.person_id in ^ids,
        update: [set: [canceled: true]]
      )
    end, [])
  end

  #
  # Helpers
  #

  defp subscription_active?(changes, id) do
    case Enum.find(changes.subscriptions, &(&1.person_id == id)) do
      nil -> false
      s -> not s.canceled
    end
  end

  defp create_or_update_subscription(changes, id) do
    case Enum.find(changes.subscriptions, &(&1.person_id == id)) do
      nil ->
        Notifications.create_subscription(%{
          subscription_list_id: changes.subscription_list.id,
          person_id: id,
          type: :invited,
        })
      s ->
        Notifications.update_subscription(s, %{
          canceled: false,
          type: :invited,
        })
    end
  end

  defp find_subscriptions_to_cancel(changes, subscriber_ids) do
    changes.subscriptions
    |> Enum.map(fn s -> s.person_id end)
    |> Enum.filter(fn id -> not Enum.member?(subscriber_ids, id) end)
  end
end
