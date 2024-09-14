defmodule Operately.Operations.Notifications.SubscriptionList do
  alias Ecto.Multi
  alias Operately.Notifications.SubscriptionList

  def insert(multi, attrs) do
    multi
    |> Multi.insert(:subscription_list, SubscriptionList.changeset(%{
      send_to_everyone: attrs.send_notifications_to_everyone,
    }))
  end

  def update(multi) do
    multi
    |> Multi.update(:updated_subscription_list, fn changes ->
      SubscriptionList.changeset(changes.subscription_list, %{
        parent_type: :project_check_in,
        parent_id: changes.check_in.id,
      })
    end)
  end
end
