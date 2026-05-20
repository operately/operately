defmodule Operately.Billing.Plans do
  @moduledoc """
  Operately plan catalog and entitlements.

  The app owns the human-friendly plan catalog. Polar owns recurring billing
  for the paid products. This module returns entitlement-level data for each
  plan without relying on provider-specific details.
  """

  defstruct [:key, :display_name, :member_limit, :storage_limit_bytes]

  @plans [
    %{key: :free, display_name: "Free", member_limit: 20, storage_limit_bytes: 1_073_741_824}, # 1 GB
    %{key: :team, display_name: "Team", member_limit: 50, storage_limit_bytes: 107_374_182_400}, # 100 GB
    %{key: :business, display_name: "Business", member_limit: 200, storage_limit_bytes: 1_099_511_627_776} # 1 TB
  ]

  @plan_keys Enum.map(@plans, & &1.key)

  def all, do: Enum.map(@plans, &struct(__MODULE__, &1))

  def get(plan_key) when is_atom(plan_key) do
    case Enum.find(@plans, &(&1.key == plan_key)) do
      nil -> nil
      plan -> struct(__MODULE__, plan)
    end
  end

  def get(plan_key) when is_binary(plan_key) do
    plan_key |> String.to_existing_atom() |> get()
  rescue
    ArgumentError -> nil
  end

  def member_limit(plan_key) do
    case get(plan_key) do
      nil -> nil
      plan -> plan.member_limit
    end
  end

  def storage_limit_bytes(plan_key) do
    case get(plan_key) do
      nil -> nil
      plan -> plan.storage_limit_bytes
    end
  end

  def valid_plan?(plan_key) do
    plan_key in @plan_keys
  end

  def plan_keys, do: @plan_keys
end
