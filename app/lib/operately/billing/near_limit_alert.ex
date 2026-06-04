defmodule Operately.Billing.NearLimitAlert do
  use Operately.Schema

  @valid_limit_keys [:member_count, :storage_bytes]

  schema "billing_near_limit_alerts" do
    belongs_to :company, Operately.Companies.Company, foreign_key: :company_id

    field :limit_key, Ecto.Enum, values: @valid_limit_keys
    field :sent_at, :utc_datetime

    timestamps()
  end

  def valid_limit_keys, do: @valid_limit_keys

  def changeset(alert, attrs) do
    alert
    |> cast(attrs, [:company_id, :limit_key, :sent_at])
    |> validate_required([:company_id, :limit_key, :sent_at])
    |> assoc_constraint(:company)
    |> unique_constraint([:company_id, :limit_key])
  end
end
