defmodule Operately.Billing.Plans do
  @moduledoc """
  Billing plan catalog and entitlements.

  Plan definitions are stored in the database so plan keys and entitlements can
  change without another schema migration. Step 1 keeps the customer-facing
  billing API on the seeded plan set while moving entitlement reads to data.
  """

  import Ecto.Query, warn: false

  alias Operately.Billing.PlanDefinition
  alias Operately.Billing.ProductCatalogEntry
  alias Operately.Repo

  def all do
    Repo.all(all_query())
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

  def list_active do
    Repo.all(display_ordered_query(active_query()))
  end

  def list_customer_selectable do
    Repo.all(display_ordered_query(customer_selectable_query()))
  end

  def list_self_serve_sellable do
    Repo.all(display_ordered_query(self_serve_sellable_query()))
  end

  def resolve_current_plan_key(plan_key) do
    normalize_key(plan_key) || "free"
  end

  def active_plan?(plan_key) do
    normalized_plan_key = normalize_key(plan_key)

    not is_nil(normalized_plan_key) and Repo.exists?(from plan in active_query(), where: plan.plan_key == ^normalized_plan_key)
  end

  def provider_managed_plan?(plan_key) do
    case get(plan_key) do
      %PlanDefinition{billing_behavior: :provider_managed} -> true
      _ -> false
    end
  end

  def customer_selectable_plan?(plan_key) do
    normalized_plan_key = normalize_key(plan_key)

    not is_nil(normalized_plan_key) and Repo.exists?(from plan in customer_selectable_query(), where: plan.plan_key == ^normalized_plan_key)
  end

  def self_serve_sellable_plan?(plan_key) do
    normalized_plan_key = normalize_key(plan_key)

    not is_nil(normalized_plan_key) and Repo.exists?(from plan in self_serve_sellable_query(), where: plan.plan_key == ^normalized_plan_key)
  end

  def cast_existing_plan_key(plan_key) do
    with normalized_plan_key when not is_nil(normalized_plan_key) <- normalize_key(plan_key),
         true <- valid_plan?(normalized_plan_key) do
      {:ok, normalized_plan_key}
    else
      _ -> {:error, :invalid_plan_key}
    end
  end

  def cast_provider_managed_plan_key(plan_key) do
    with normalized_plan_key when not is_nil(normalized_plan_key) <- normalize_key(plan_key),
         true <- provider_managed_plan?(normalized_plan_key) do
      {:ok, normalized_plan_key}
    else
      _ -> {:error, :invalid_plan_key}
    end
  end

  def cast_customer_selectable_plan_key(plan_key) do
    with normalized_plan_key when not is_nil(normalized_plan_key) <- normalize_key(plan_key),
         true <- customer_selectable_plan?(normalized_plan_key) do
      {:ok, normalized_plan_key}
    else
      _ -> {:error, :invalid_plan_key}
    end
  end

  def compare_rank(left_plan_key, right_plan_key) do
    rank(left_plan_key) - rank(right_plan_key)
  end

  def next_upgrade_plan_keys(plan_key) do
    higher_ranked_plan_keys(active_query(), plan_key)
  end

  def next_self_serve_upgrade_plan_keys(plan_key) do
    higher_ranked_plan_keys(self_serve_sellable_query(), plan_key)
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

  defp all_query do
    display_ordered_query(base_query())
  end

  defp base_query do
    from(plan in PlanDefinition)
  end

  defp active_query do
    from(plan in base_query(), where: is_nil(plan.archived_at))
  end

  defp customer_selectable_query do
    from(plan in active_query(),
      where: plan.billing_behavior == :provider_managed and plan.customer_selectable == true
    )
  end

  defp self_serve_sellable_query do
    from(plan in customer_selectable_query(),
      join: product in ProductCatalogEntry, on: product.plan_family == plan.plan_key,
      where: product.active == true and is_nil(product.archived_at),
      distinct: plan.id
    )
  end

  defp display_ordered_query(query) do
    from(plan in query, order_by: [asc: plan.sort_order, asc: plan.inserted_at])
  end

  defp higher_ranked_plan_keys(query, plan_key) do
    case get(plan_key) do
      %PlanDefinition{tier_rank: tier_rank} ->
        query
        |> where([plan], plan.tier_rank > ^tier_rank)
        |> Repo.all()
        |> Enum.sort_by(&{&1.tier_rank, &1.sort_order, &1.inserted_at}, :asc)
        |> Enum.map(& &1.plan_key)

      nil ->
        query
        |> Repo.all()
        |> Enum.sort_by(&{&1.tier_rank, &1.sort_order, &1.inserted_at}, :asc)
        |> Enum.map(& &1.plan_key)
    end
  end

  defp rank(plan_key) do
    case get(plan_key) do
      %PlanDefinition{tier_rank: tier_rank} -> tier_rank
      nil -> -1
    end
  end
end
