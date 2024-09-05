defmodule Operately.Operations.NotificationsUnsubscribing do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Notifications.Subscription

  def run(person_id, subscription_list_id) do
    Multi.new()
    |> Multi.delete_all(:subscriptions, fn _ ->
      from(s in Subscription,
        where: s.person_id == ^person_id and s.subscription_list_id == ^subscription_list_id
      )
    end)
    |> Repo.transaction()
  end
end
