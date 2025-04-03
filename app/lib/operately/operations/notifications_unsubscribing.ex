defmodule Operately.Operations.NotificationsUnsubscribing do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Notifications.Subscription

  def run(person_id, subscription_list_id) do
    Multi.new()
    |> Multi.run(:subscription, fn _, _ ->
      from(s in Subscription, where: s.person_id == ^person_id and s.subscription_list_id == ^subscription_list_id)
      |> Repo.one()
      |> case do
        nil -> {:error, nil}
        subscription -> {:ok, subscription}
      end
    end)
    |> Multi.update(:updated_subscriptions, fn changes ->
      Subscription.changeset(changes.subscription, %{canceled: true})
    end)
    |> Repo.transaction()
  end
end
