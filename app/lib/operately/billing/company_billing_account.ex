defmodule Operately.Billing.CompanyBillingAccount do
  use Operately.Schema
  use Operately.Repo.Getter

  @valid_plan_keys [:team, :business]
  @valid_billing_intervals [:monthly, :yearly]
  @valid_statuses [:free, :active, :past_due, :canceled]
  @valid_access_states [:normal, :payment_grace, :over_limit_grace, :read_only]
  @valid_access_state_reasons [:past_due, :over_limit_after_downgrade]

  schema "company_billing_accounts" do
    belongs_to :company, Operately.Companies.Company, foreign_key: :company_id

    field :provider, :string, default: "polar"
    field :plan_key, Ecto.Enum, values: @valid_plan_keys
    field :billing_interval, Ecto.Enum, values: @valid_billing_intervals
    field :status, Ecto.Enum, values: @valid_statuses, default: :free
    field :suggested_plan_key, Ecto.Enum, values: @valid_plan_keys
    field :suggested_billing_interval, Ecto.Enum, values: @valid_billing_intervals
    field :suggested_plan_source, :string
    field :current_period_end, :utc_datetime
    field :cancel_at_period_end, :boolean, default: false
    field :pending_plan_key, Ecto.Enum, values: @valid_plan_keys
    field :pending_billing_interval, Ecto.Enum, values: @valid_billing_intervals
    field :pending_checkout_started_at, :utc_datetime
    field :scheduled_plan_key, Ecto.Enum, values: @valid_plan_keys
    field :scheduled_billing_interval, Ecto.Enum, values: @valid_billing_intervals
    field :scheduled_change_effective_at, :utc_datetime
    field :last_synced_at, :utc_datetime
    field :access_state, Ecto.Enum, values: @valid_access_states, default: :normal
    field :access_state_reason, Ecto.Enum, values: @valid_access_state_reasons
    field :access_state_started_at, :utc_datetime
    field :access_state_ends_at, :utc_datetime

    timestamps()
  end

  def valid_plan_keys, do: @valid_plan_keys
  def valid_billing_intervals, do: @valid_billing_intervals
  def valid_statuses, do: @valid_statuses
  def valid_access_states, do: @valid_access_states
  def valid_access_state_reasons, do: @valid_access_state_reasons

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(account, attrs) do
    account
    |> cast(attrs, [
      :company_id,
      :provider,
      :plan_key,
      :billing_interval,
      :status,
      :suggested_plan_key,
      :suggested_billing_interval,
      :suggested_plan_source,
      :current_period_end,
      :cancel_at_period_end,
      :pending_plan_key,
      :pending_billing_interval,
      :pending_checkout_started_at,
      :scheduled_plan_key,
      :scheduled_billing_interval,
      :scheduled_change_effective_at,
      :last_synced_at,
      :access_state,
      :access_state_reason,
      :access_state_started_at,
      :access_state_ends_at
    ])
    |> validate_required([:company_id, :provider, :status])
    |> assoc_constraint(:company)
  end
end
