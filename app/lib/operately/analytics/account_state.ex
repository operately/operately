defmodule Operately.Analytics.AccountState do
  use Operately.Schema

  @primary_key false
  schema "analytics_accounts" do
    field :account_id, :binary_id, primary_key: true
    field :attribution, :map, default: %{}
    field :opted_out, :boolean, default: false
    field :signup_kind, Ecto.Enum, values: [:self_service, :invitation]
    field :completed_at, :utc_datetime_usec
  end
end
