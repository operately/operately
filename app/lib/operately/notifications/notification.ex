defmodule Operately.Notifications.Notification do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "notifications" do
    belongs_to :activity, Operately.Activities.Activity
    belongs_to :person, Operately.People.Person

    field :email_sent, :boolean, default: false
    field :email_sent_at, :naive_datetime
    field :read, :boolean, default: false
    field :read_at, :naive_datetime
    field :should_send_email, :boolean, default: false

    timestamps()
  end

  @doc false
  def changeset(notification, attrs) do
    notification
    |> cast(attrs, [:read, :read_at, :email_sent, :email_sent_at, :should_send_email, :person_id, :activity_id])
    |> validate_required([:should_send_email, :person_id, :activity_id])
  end
end
