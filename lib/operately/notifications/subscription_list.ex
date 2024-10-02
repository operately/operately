defmodule Operately.Notifications.SubscriptionList do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "subscription_lists" do
    field :parent_id, Ecto.UUID
    field :parent_type, Ecto.Enum, values: [:project_check_in, :project_retrospective, :goal_update, :message]
    field :send_to_everyone, :boolean, default: false

    has_many :subscriptions, Operately.Notifications.Subscription, foreign_key: :subscription_list_id

    timestamps()
    request_info()
    requester_access_level()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(subscription_list, attrs) do
    subscription_list
    |> cast(attrs, [:parent_id, :parent_type, :send_to_everyone])
    |> validate_required([])
  end
end
