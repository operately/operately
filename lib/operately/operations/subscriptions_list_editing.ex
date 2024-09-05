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
    |> Multi.update(:subscription_list, SubscriptionList.changeset(subscription_list, %{
      send_to_everyone: attrs.send_notifications_to_everyone,
    }))
    |> insert_subscriptions(attrs.subscriber_ids)
    |> delete_subscriptions(attrs.subscriber_ids)
    |> Repo.transaction()
  end

  defp insert_subscriptions(multi, subscriber_ids) do
    Enum.reduce(subscriber_ids, multi, fn id, multi ->
      name = "subscription_" <> id

      Multi.run(multi, name, fn _, changes ->
        if is_existing_subscription?(changes, id) do
          {:ok, nil}
        else
          Notifications.create_subscription(%{
            subscription_list_id: changes.subscription_list.id,
            person_id: id,
            type: :invited,
          })
        end
      end)
    end)
  end

  defp delete_subscriptions(multi, subscriber_ids) do
    multi
    |> Multi.delete_all(:deleted_subscriptions, fn changes ->
      ids = find_subscriptions_to_delete(changes, subscriber_ids)

      from(s in Subscription,
        where: s.subscription_list_id == ^changes.subscription_list.id and s.person_id in ^ids
      )
    end)
  end

  #
  # Helpers
  #

  defp is_existing_subscription?(changes, id) do
    Enum.map(changes.subscriptions, fn s -> s.person_id end)
    |> Enum.member?(id)
  end

  defp find_subscriptions_to_delete(changes, subscriber_ids) do
    changes.subscriptions
    |> Enum.map(fn s -> s.person_id end)
    |> Enum.filter(fn id -> not Enum.member?(subscriber_ids, id) end)
  end
end
