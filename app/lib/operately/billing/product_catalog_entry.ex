defmodule Operately.Billing.ProductCatalogEntry do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "billing_products" do
    field :provider, :string, default: "polar"
    field :plan_family, :string
    field :billing_interval, :string
    field :polar_product_id, :string
    field :polar_product_name, :string
    field :price_amount, :integer
    field :price_currency, :string
    field :version, :integer, default: 1
    field :active, :boolean, default: false
    field :archived_at, :utc_datetime
    field :provider_payload, :map
    field :last_synced_at, :utc_datetime

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(entry, attrs) do
    entry
    |> cast(attrs, [
      :provider,
      :plan_family,
      :billing_interval,
      :polar_product_id,
      :polar_product_name,
      :price_amount,
      :price_currency,
      :version,
      :active,
      :archived_at,
      :provider_payload,
      :last_synced_at
    ])
    |> validate_required([:provider, :plan_family, :billing_interval, :polar_product_id])
    |> validate_inclusion(:billing_interval, ["monthly", "yearly"])
    |> validate_inclusion(:plan_family, ["team", "business"])
  end
end
