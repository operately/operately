defmodule Operately.Billing.CompanyBillingAccount do
  def __api_typename__, do: "billing_account"

  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Billing.Plans

  @valid_billing_intervals [:monthly, :yearly]
  @valid_statuses [:free, :active, :past_due, :canceled]
  @valid_access_states [:normal, :payment_grace, :over_limit_grace, :read_only]
  @valid_access_state_reasons [:past_due, :over_limit_after_downgrade]

  @plan_key_fields [:plan_key, :suggested_plan_key, :pending_plan_key, :scheduled_plan_key]

  schema "company_billing_accounts" do
    belongs_to :company, Operately.Companies.Company, foreign_key: :company_id

    field :provider, :string, default: "polar"
    field :plan_key, :string
    field :billing_interval, Ecto.Enum, values: @valid_billing_intervals
    field :status, Ecto.Enum, values: @valid_statuses, default: :free
    field :suggested_plan_key, :string
    field :suggested_billing_interval, Ecto.Enum, values: @valid_billing_intervals
    field :suggested_plan_source, :string
    field :current_period_end, :utc_datetime
    field :cancel_at_period_end, :boolean, default: false
    field :pending_plan_key, :string
    field :pending_billing_interval, Ecto.Enum, values: @valid_billing_intervals
    field :pending_checkout_started_at, :utc_datetime
    field :scheduled_plan_key, :string
    field :scheduled_billing_interval, Ecto.Enum, values: @valid_billing_intervals
    field :scheduled_change_effective_at, :utc_datetime
    field :last_synced_at, :utc_datetime
    field :access_state, Ecto.Enum, values: @valid_access_states, default: :normal
    field :access_state_reason, Ecto.Enum, values: @valid_access_state_reasons
    field :access_state_started_at, :utc_datetime
    field :access_state_ends_at, :utc_datetime

    timestamps()
  end

  def valid_billing_intervals, do: @valid_billing_intervals
  def valid_statuses, do: @valid_statuses
  def valid_access_states, do: @valid_access_states
  def valid_access_state_reasons, do: @valid_access_state_reasons

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(account, attrs) do
    attrs = normalize_plan_key_attrs(attrs)

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
    |> validate_plan_key_fields()
    |> assoc_constraint(:company)
  end

  # Plan keys are stored as strings, so normalize mixed inputs and reject unknown values here.
  defp validate_plan_key_fields(changeset) do
    Enum.reduce(@plan_key_fields, changeset, fn field, changeset ->
      validate_change(changeset, field, fn ^field, value ->
        validate_plan_key_value(field, value)
      end)
    end)
  end

  defp validate_plan_key_value(_field, nil), do: []

  defp validate_plan_key_value(field, value) do
    if Plans.valid_plan?(value) do
      []
    else
      [{field, "is invalid"}]
    end
  end

  defp normalize_plan_key_attrs(attrs) when is_map(attrs) do
    Enum.reduce(@plan_key_fields, attrs, fn field, attrs ->
      normalize_plan_key_attr(attrs, field)
    end)
  end

  defp normalize_plan_key_attrs(attrs), do: attrs

  defp normalize_plan_key_attr(attrs, field) do
    string_field = Atom.to_string(field)

    cond do
      Map.has_key?(attrs, field) ->
        Map.update!(attrs, field, &Plans.normalize_key/1)

      Map.has_key?(attrs, string_field) ->
        Map.update!(attrs, string_field, &Plans.normalize_key/1)

      true ->
        attrs
    end
  end
end
