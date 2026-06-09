defmodule Operately.Billing.PlanDefinition do
  use Operately.Schema

  alias Operately.Billing.Plans

  @create_fields [
    :plan_key,
    :display_name,
    :sort_order,
    :tier_rank,
    :billing_behavior,
    :customer_selectable,
    :member_limit,
    :storage_limit_bytes,
    :archived_at
  ]

  @update_fields [
    :display_name,
    :sort_order,
    :tier_rank,
    :billing_behavior,
    :customer_selectable,
    :member_limit,
    :storage_limit_bytes,
    :archived_at
  ]

  schema "billing_plan_definitions" do
    field :plan_key, :string
    field :display_name, :string
    field :sort_order, :integer
    field :tier_rank, :integer
    field :billing_behavior, Ecto.Enum, values: [:internal, :provider_managed]
    field :customer_selectable, :boolean, default: false
    field :member_limit, :integer
    field :storage_limit_bytes, :integer
    field :archived_at, :utc_datetime

    timestamps()
  end

  def changeset(attrs) do
    create_changeset(%__MODULE__{}, attrs)
  end

  def changeset(plan_definition, attrs) do
    create_changeset(plan_definition, attrs)
  end

  def create_changeset(plan_definition, attrs) do
    plan_definition
    |> cast(attrs, @create_fields)
    |> normalize_plan_key()
    |> validate_fields()
  end

  def update_changeset(plan_definition, attrs) do
    plan_definition
    |> cast(attrs, @update_fields)
    |> validate_fields()
  end

  defp validate_fields(changeset) do
    changeset
    |> validate_required([:plan_key, :display_name, :sort_order, :tier_rank, :billing_behavior, :customer_selectable])
    |> validate_number(:sort_order, greater_than_or_equal_to: 0)
    |> validate_number(:tier_rank, greater_than_or_equal_to: 0)
    |> validate_number(:member_limit, greater_than: 0)
    |> validate_number(:storage_limit_bytes, greater_than: 0)
    |> validate_customer_selectable_for_behavior()
    |> unique_constraint(:plan_key)
    |> unique_constraint(:sort_order, name: :billing_plan_definitions_active_sort_order_index)
    |> unique_constraint(:tier_rank, name: :billing_plan_definitions_active_tier_rank_index)
  end

  defp normalize_plan_key(changeset) do
    update_change(changeset, :plan_key, &Plans.normalize_key/1)
  end

  defp validate_customer_selectable_for_behavior(changeset) do
    if get_field(changeset, :billing_behavior) == :internal and get_field(changeset, :customer_selectable) == true do
      add_error(changeset, :customer_selectable, "must be false for internal plans")
    else
      changeset
    end
  end
end
