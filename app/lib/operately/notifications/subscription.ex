defmodule Operately.Notifications.Subscription do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "subscriptions" do
    belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id
    belongs_to :person, Operately.People.Person, foreign_key: :person_id, where: [suspended_at: nil]

    field :type, Ecto.Enum, values: [:invited, :joined, :mentioned]
    field :canceled, :boolean, default: false

    timestamps()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(subscriptions, attrs) do
    subscriptions
    |> cast(attrs, [:type, :subscription_list_id, :person_id, :canceled])
    |> validate_required([:type, :subscription_list_id, :person_id])
    |> unique_constraint([:subscription_list_id, :person_id], name: :subscriptions_subscription_list_id_person_id_index)
  end
end
