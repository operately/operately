defmodule Operately.Notifications.Notification do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "notifications" do
    field :email_sent, :boolean, default: false
    field :email_sent_at, :naive_datetime
    field :read, :boolean, default: false
    field :read_at, :naive_datetime
    field :should_send_email, :boolean, default: false
    field :activity_id, :binary_id
    field :person_id, :binary_id

    timestamps()
  end

  @doc false
  def changeset(notification, attrs) do
    notification
    |> cast(attrs, [:read, :read_at, :email_sent, :email_sent_at, :should_send_email])
    |> validate_required([:read, :read_at, :email_sent, :email_sent_at, :should_send_email])
  end
end
