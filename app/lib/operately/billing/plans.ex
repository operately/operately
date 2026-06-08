defmodule Operately.Billing.Plans do
  @moduledoc """
  Billing plan catalog and entitlements.

  Plan definitions are stored in the database so plan keys and entitlements can
  change without another schema migration. Step 1 keeps the customer-facing
  billing API on the seeded plan set while moving entitlement reads to data.
  """

  import Ecto.Query, warn: false

  alias Operately.Billing.PlanDefinition
  alias Operately.Repo

  @seeded_plan_keys [:free, :team, :business, :unlimited]
  @seeded_paid_plan_keys [:team, :business, :unlimited]

  def all do
    Repo.all(from plan in PlanDefinition, order_by: [asc: plan.sort_order, asc: plan.inserted_at])
  end

  def get(plan_key) do
    case normalize_key(plan_key) do
      nil -> nil
      key -> Repo.get_by(PlanDefinition, plan_key: key)
    end
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
    not is_nil(get(plan_key))
  end

  def plan_keys do
    all()
    |> Enum.map(& &1.plan_key)
  end

  def seeded_plan_keys, do: @seeded_plan_keys
  def seeded_paid_plan_keys, do: @seeded_paid_plan_keys

  def paid_plan_key_strings do
    Enum.map(@seeded_paid_plan_keys, &Atom.to_string/1)
  end

  def cast_paid_plan_key(plan_key) do
    case atom_key(plan_key) do
      key when key in @seeded_paid_plan_keys -> {:ok, Atom.to_string(key)}
      _ -> {:error, :invalid_plan_key}
    end
  end

  def compare_rank(left_plan_key, right_plan_key) do
    rank(left_plan_key) - rank(right_plan_key)
  end

  def next_upgrade_plan_keys(plan_key) do
    ordered_plan_keys = plan_keys()

    case Enum.find_index(ordered_plan_keys, &(&1 == normalize_key(plan_key))) do
      nil -> Enum.reject(ordered_plan_keys, &(&1 == "free"))
      index -> Enum.drop(ordered_plan_keys, index + 1)
    end
  end

  def normalize_key(nil), do: nil
  def normalize_key(plan_key) when is_atom(plan_key), do: Atom.to_string(plan_key)

  def normalize_key(plan_key) when is_binary(plan_key) do
    plan_key
    |> String.trim()
    |> String.downcase()
    |> case do
      "" -> nil
      normalized_key -> normalized_key
    end
  end

  def normalize_key(_), do: nil

  def atom_key(plan_key) do
    case normalize_key(plan_key) do
      "free" -> :free
      "team" -> :team
      "business" -> :business
      "unlimited" -> :unlimited
      _ -> nil
    end
  end

  defp rank(plan_key) do
    case get(plan_key) do
      %PlanDefinition{sort_order: sort_order} -> sort_order
      nil -> -1
    end
  end
end
