defmodule Operately.Analytics.Activation do
  use Operately.Schema

  @primary_key false
  schema "analytics_activations" do
    field :company_id, :binary_id, primary_key: true
    field :rule_version, :integer, primary_key: true
    field :activated_at, :utc_datetime_usec
  end
end
