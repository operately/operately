defmodule Operately.Operations.Notifications.SubscriptionList do
  alias Ecto.Multi
  alias Operately.Notifications.SubscriptionList

  def insert(multi, attrs) do
    multi
    |> Multi.insert(:subscription_list, SubscriptionList.changeset(%{
      send_to_everyone: attrs[:send_to_everyone] || false,
      parent_type: attrs.subscription_parent_type,
    }))
  end

  def update(multi, key) do
    multi
    |> Multi.update(:updated_subscription_list, fn changes ->
      SubscriptionList.changeset(changes.subscription_list, %{
        parent_id: changes[key].id,
      })
    end)
  end
end
