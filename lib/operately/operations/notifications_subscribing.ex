defmodule Operately.Operations.NotificationsSubscribing do
  alias Ecto.Multi
  alias Operately.{Repo, Notifications}

  def run(person_id, subscription_list_id) do
    Multi.new()
    |> Multi.run(:existing_subscription, fn _, _ ->
      {:ok, Notifications.get_subscription(person_id: person_id, subscription_list_id: subscription_list_id)}
    end)
    |> Multi.run(:subscription, fn _, changes ->
      case changes.existing_subscription do
        nil ->
          Notifications.create_subscription(%{
            person_id: person_id,
            subscription_list_id: subscription_list_id,
            type: :joined
          })
        subscription ->
          Notifications.update_subscription(subscription, %{
            canceled: false,
            type: :joined
          })
      end
    end)
    |> Repo.transaction()
  end
end
