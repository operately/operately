defmodule Operately.Notifications.Subscription do
  use Operately.Schema

  schema "subscriptions" do
    belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id
    belongs_to :person, Operately.People.Person, foreign_key: :person_id

    field :type, Ecto.Enum, values: [:invited, :joined, :mentioned]
    field :canceled, :boolean, default: false

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(subscriptions, attrs) do
    subscriptions
    |> cast(attrs, [:type, :subscription_list_id, :person_id, :canceled])
    |> validate_required([:type, :subscription_list_id, :person_id])
  end
end
