defmodule Operately.Analytics.CompanyState do
  use Operately.Schema

  @primary_key false
  schema "analytics_companies" do
    field :company_id, :binary_id, primary_key: true
    field :creator_account_id, :binary_id
    field :attribution, :map, default: %{}
    field :created_at, :utc_datetime_usec
  end
end
