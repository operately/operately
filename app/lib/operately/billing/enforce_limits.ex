defmodule Operately.Billing.EnforceLimits do
  alias Operately.Billing
  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.Plans

  @upgrade_order [:free, :team, :business]

  defmodule LimitStatus do
    @enforce_keys [:limit_key, :plan_key, :current_usage, :requested_delta, :projected_usage, :limit, :remaining, :near_limit, :blocked, :enforced, :recommended_upgrade]
    defstruct @enforce_keys
  end

  defmodule LimitError do
    @enforce_keys [:code, :limit_key, :plan_key, :current_usage, :requested_delta, :projected_usage, :limit, :remaining, :near_limit, :blocked, :enforced, :recommended_upgrade]
    defstruct @enforce_keys
  end

  def status(%Operately.Companies.Company{} = company, limit_key, opts \\ []) do
    normalized_limit_key = normalize_limit_key(limit_key)
    requested_delta = normalize_requested_delta(opts)
    account = Billing.get_billing_account_by_company(company)
    plan_key = effective_plan_key(account)
    limit = plan_limit(plan_key, normalized_limit_key)
    current_usage = resolve_current_usage(company, normalized_limit_key, opts)
    projected_usage = current_usage + requested_delta
    enforced = Billing.billing_enabled_for_company?(company)

    %LimitStatus{
      limit_key: normalized_limit_key,
      plan_key: plan_key,
      current_usage: current_usage,
      requested_delta: requested_delta,
      projected_usage: projected_usage,
      limit: limit,
      remaining: max(limit - current_usage, 0),
      near_limit: enforced && current_usage >= near_limit_threshold(limit),
      blocked: enforced && projected_usage > limit,
      enforced: enforced,
      recommended_upgrade: recommended_upgrade(company, account, plan_key, enforced, opts)
    }
  end

  def check(%Operately.Companies.Company{} = company, limit_key, opts \\ []) do
    case status(company, limit_key, opts) do
      %LimitStatus{blocked: true} = status -> {:error, error_from_status(status)}
      _status -> :ok
    end
  end

  def public_message(%LimitError{code: :member_count_limit_exceeded}) do
    "This company has reached its member limit. Upgrade the plan to add more people."
  end

  def public_message(%LimitError{code: :storage_limit_exceeded}) do
    "This company has reached its storage limit. Upgrade the plan to add more files."
  end

  def to_api_error(%LimitError{} = error) do
    {:error, :bad_request, public_message(error), public_details(error)}
  end

  def public_details(%LimitStatus{} = status) do
    %{
      code: Atom.to_string(error_code(status.limit_key)),
      limit_key: Atom.to_string(status.limit_key),
      plan_key: normalize_optional_atom(status.plan_key),
      current_usage: status.current_usage,
      requested_delta: status.requested_delta,
      projected_usage: status.projected_usage,
      limit: status.limit,
      remaining: status.remaining,
      near_limit: status.near_limit,
      blocked: status.blocked,
      enforced: status.enforced,
      recommended_upgrade: public_recommended_upgrade(status.recommended_upgrade)
    }
  end

  def public_details(%LimitError{} = error) do
    %{
      code: Atom.to_string(error.code),
      limit_key: Atom.to_string(error.limit_key),
      plan_key: normalize_optional_atom(error.plan_key),
      current_usage: error.current_usage,
      requested_delta: error.requested_delta,
      projected_usage: error.projected_usage,
      limit: error.limit,
      remaining: error.remaining,
      near_limit: error.near_limit,
      blocked: error.blocked,
      enforced: error.enforced,
      recommended_upgrade: public_recommended_upgrade(error.recommended_upgrade)
    }
  end

  def public_snapshot(%LimitStatus{} = status) do
    status
    |> public_details()
    |> Map.delete(:recommended_upgrade)
  end

  def near_limit_threshold(limit) when is_integer(limit) do
    limit
    |> Kernel.*(0.9)
    |> Float.ceil()
    |> trunc()
  end

  defp error_from_status(%LimitStatus{} = status) do
    %LimitError{
      code: error_code(status.limit_key),
      limit_key: status.limit_key,
      plan_key: status.plan_key,
      current_usage: status.current_usage,
      requested_delta: status.requested_delta,
      projected_usage: status.projected_usage,
      limit: status.limit,
      remaining: status.remaining,
      near_limit: status.near_limit,
      blocked: status.blocked,
      enforced: status.enforced,
      recommended_upgrade: status.recommended_upgrade
    }
  end

  defp normalize_limit_key(limit_key) when limit_key in [:member_count, :storage_bytes], do: limit_key

  defp normalize_limit_key(limit_key) do
    raise ArgumentError, "unsupported billing limit key: #{inspect(limit_key)}"
  end

  defp normalize_requested_delta(opts) do
    case Keyword.get(opts, :requested_delta, 0) do
      delta when is_integer(delta) -> delta
      delta -> raise ArgumentError, "requested_delta must be an integer, got: #{inspect(delta)}"
    end
  end

  defp effective_plan_key(nil), do: :free
  defp effective_plan_key(%CompanyBillingAccount{plan_key: nil}), do: :free
  defp effective_plan_key(%CompanyBillingAccount{plan_key: plan_key}), do: plan_key

  defp plan_limit(plan_key, :member_count), do: Plans.member_limit(plan_key)
  defp plan_limit(plan_key, :storage_bytes), do: Plans.storage_limit_bytes(plan_key)

  defp resolve_current_usage(%Operately.Companies.Company{} = company, :member_count, opts) do
    case Keyword.fetch(opts, :current_usage) do
      {:ok, current_usage} -> normalize_current_usage(current_usage)
      :error -> Billing.active_member_count(company)
    end
  end

  defp resolve_current_usage(_company, limit_key, opts) do
    opts
    |> Keyword.fetch!(:current_usage)
    |> normalize_current_usage(limit_key)
  rescue
    KeyError ->
      raise ArgumentError, "current_usage is required for #{inspect(limit_key)}"
  end

  defp normalize_current_usage(current_usage, _limit_key \\ nil)
  defp normalize_current_usage(current_usage, _limit_key) when is_integer(current_usage), do: current_usage

  defp normalize_current_usage(current_usage, limit_key) do
    raise ArgumentError, "current_usage must be an integer for #{inspect(limit_key)}, got: #{inspect(current_usage)}"
  end

  defp recommended_upgrade(_company, _account, _plan_key, false, _opts), do: nil

  defp recommended_upgrade(%Operately.Companies.Company{} = company, account, plan_key, true, opts) do
    catalog_products = Keyword.get_lazy(opts, :catalog_products, fn -> Billing.list_active_products() end)

    with {:ok, recommendation} <- suggested_recommendation(account, plan_key, catalog_products) do
      recommendation
    else
      _ ->
        fallback_recommendation(company, plan_key, account, catalog_products)
    end
  end

  defp suggested_recommendation(nil, _plan_key, _catalog_products), do: :error

  defp suggested_recommendation(%CompanyBillingAccount{} = account, plan_key, catalog_products) do
    target_plan_key = account.suggested_plan_key

    cond do
      is_nil(target_plan_key) ->
        :error

      !valid_upgrade?(plan_key, target_plan_key) ->
        :error

      true ->
        target_interval = suggested_target_interval(account, target_plan_key, catalog_products)

        case recommendation_for_plan(target_plan_key, target_interval, :suggested, catalog_products) do
          nil -> :error
          recommendation -> {:ok, recommendation}
        end
    end
  end

  defp fallback_recommendation(_company, plan_key, account, catalog_products) do
    fallback_interval = fallback_interval(account)

    Enum.find_value(next_upgrade_plan_keys(plan_key), fn next_plan_key ->
      recommendation_for_plan(next_plan_key, fallback_interval, :next_plan, catalog_products)
    end)
  end

  defp recommendation_for_plan(plan_key, preferred_interval, source, catalog_products) do
    case find_product_for_plan(catalog_products, plan_key, preferred_interval) do
      nil ->
        nil

      product ->
        %{
          plan_key: plan_key,
          billing_interval: product.billing_interval,
          source: source
        }
    end
  end

  defp find_product_for_plan(catalog_products, plan_key, preferred_interval) do
    Enum.find(catalog_products, &(&1.plan_family == plan_key and &1.billing_interval == preferred_interval)) ||
      Enum.find(catalog_products, &(&1.plan_family == plan_key and &1.billing_interval == :monthly)) ||
      Enum.find(catalog_products, &(&1.plan_family == plan_key))
  end

  defp suggested_target_interval(%CompanyBillingAccount{} = account, target_plan_key, catalog_products) do
    case account.suggested_billing_interval do
      nil -> fallback_interval_for_plan(account, target_plan_key, catalog_products)
      interval -> interval
    end
  end

  defp fallback_interval_for_plan(%CompanyBillingAccount{} = account, target_plan_key, catalog_products) do
    case fallback_interval(account) do
      interval when is_atom(interval) ->
        if Enum.any?(catalog_products, &(&1.plan_family == target_plan_key and &1.billing_interval == interval)) do
          interval
        else
          :monthly
        end
    end
  end

  defp fallback_interval(%CompanyBillingAccount{status: status, billing_interval: interval})
       when status in [:active, :past_due, :canceled] and interval in [:monthly, :yearly] do
    interval
  end

  defp fallback_interval(_account), do: :monthly

  defp next_upgrade_plan_keys(plan_key) do
    case Enum.find_index(@upgrade_order, &(&1 == plan_key)) do
      nil -> @upgrade_order
      index -> Enum.drop(@upgrade_order, index + 1)
    end
  end

  defp valid_upgrade?(current_plan_key, target_plan_key) do
    compare_plan_rank(target_plan_key) > compare_plan_rank(current_plan_key)
  end

  defp compare_plan_rank(plan_key) do
    Enum.find_index(@upgrade_order, &(&1 == plan_key)) || -1
  end

  defp error_code(:member_count), do: :member_count_limit_exceeded
  defp error_code(:storage_bytes), do: :storage_limit_exceeded

  defp public_recommended_upgrade(nil), do: nil

  defp public_recommended_upgrade(recommendation) do
    %{
      plan_key: normalize_optional_atom(recommendation[:plan_key]),
      billing_interval: normalize_optional_atom(recommendation[:billing_interval]),
      source: normalize_optional_atom(recommendation[:source])
    }
  end

  defp normalize_optional_atom(nil), do: nil
  defp normalize_optional_atom(value) when is_atom(value), do: Atom.to_string(value)
  defp normalize_optional_atom(value), do: value
end
