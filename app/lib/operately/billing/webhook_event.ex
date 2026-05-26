defmodule Operately.Billing.WebhookEvent do
  use Operately.Schema

  schema "billing_webhook_events" do
    field :provider, :string, default: "polar"
    field :event_id, :string
    field :event_type, :string
    field :payload, :map
    field :received_at, :utc_datetime
    field :processed_at, :utc_datetime
    field :status, Ecto.Enum, values: [:pending, :processing, :processed, :failed], default: :pending
    field :error, :string

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(event, attrs) do
    event
    |> cast(attrs, [
      :provider,
      :event_id,
      :event_type,
      :payload,
      :received_at,
      :processed_at,
      :status,
      :error
    ])
    |> validate_required([:provider, :event_id, :event_type, :payload, :received_at, :status])
    |> unique_constraint(:event_id, name: :billing_webhook_events_provider_event_id_index)
  end
end
