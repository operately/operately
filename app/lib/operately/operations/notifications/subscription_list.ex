defmodule Operately.Operations.Notifications.SubscriptionList do
  alias Ecto.Multi
  alias Operately.Notifications.SubscriptionList

  def insert(multi, attrs, opts \\ []) do
    key = Keyword.get(opts, :key, :subscription_list)

    multi
    |> Multi.insert(
      key,
      SubscriptionList.changeset(%{
        send_to_everyone: attrs[:send_to_everyone] || false,
        parent_type: attrs.subscription_parent_type
      })
    )
  end

  def update(multi, resource_key, opts \\ []) do
    subscription_list_key = Keyword.get(opts, :subscription_list_key, :subscription_list)
    update_key = Keyword.get(opts, :update_key, :updated_subscription_list)

    multi
    |> Multi.update(update_key, fn changes ->
      SubscriptionList.changeset(changes[subscription_list_key], %{
        parent_id: changes[resource_key].id
      })
    end)
  end
end
