defmodule Operately.Notifications.Subscriptions do
  use Operately.Schema

  schema "subscriptions" do
    belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id
    belongs_to :person, Operately.People.Person, foreign_key: :person_id

    field :type, Ecto.Enum, values: [:invited, :joined, :mentioned]

    timestamps()
  end

  def changeset(subscriptions, attrs) do
    subscriptions
    |> cast(attrs, [:type, :subscription_list_id, :person_id])
    |> validate_required([:type, :subscription_list_id, :person_id])
  end
end
