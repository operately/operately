defmodule Operately.Billing.PlanDefinition do
  use Operately.Schema

  schema "billing_plan_definitions" do
    field :plan_key, :string
    field :display_name, :string
    field :sort_order, :integer
    field :member_limit, :integer
    field :storage_limit_bytes, :integer

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(plan_definition, attrs) do
    plan_definition
    |> cast(attrs, [:plan_key, :display_name, :sort_order, :member_limit, :storage_limit_bytes])
    |> validate_required([:plan_key, :display_name, :sort_order])
    |> validate_number(:sort_order, greater_than_or_equal_to: 0)
    |> validate_number(:member_limit, greater_than: 0)
    |> validate_number(:storage_limit_bytes, greater_than: 0)
    |> unique_constraint(:plan_key)
    |> unique_constraint(:sort_order)
  end
end
