defmodule Operately.Operations.NotificationsSubscribing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Notifications.Subscription

  def run(person_id, subscription_list_id) do
    Multi.new()
    |> Multi.insert(:subscription, Subscription.changeset(%{
      person_id: person_id,
      subscription_list_id: subscription_list_id,
      type: :joined,
    }))
    |> Repo.transaction()
  end
end
