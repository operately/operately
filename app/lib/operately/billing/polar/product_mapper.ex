defmodule Operately.Billing.Polar.ProductMapper do
  @moduledoc """
  Maps Polar product payloads to Operately's local billing catalog shape.

  This module is intentionally strict: it only accepts products that were
  created and tagged as Operately-managed. Manual Polar products are ignored
  rather than guessed from names or price data.
  """

  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.Inputs
  alias Operately.Billing.PlanDefinition
  alias Operately.Billing.Plans

  @valid_billing_intervals CompanyBillingAccount.valid_billing_intervals()
  @managed_metadata_key "operately_managed"
  @plan_family_metadata_key "operately_plan_family"
  @billing_interval_metadata_key "operately_billing_interval"
  @version_metadata_key "operately_version"
  @plan_display_name_metadata_key "operately_plan_display_name"
  @plan_tier_rank_metadata_key "operately_plan_tier_rank"
  @plan_customer_selectable_metadata_key "operately_plan_customer_selectable"
  @plan_member_limit_metadata_key "operately_plan_member_limit"
  @plan_storage_limit_bytes_metadata_key "operately_plan_storage_limit_bytes"
  @plan_metadata_version_metadata_key "operately_plan_metadata_version"
  @plan_metadata_version 1
  @plan_snapshot_metadata_keys [
    @plan_display_name_metadata_key,
    @plan_tier_rank_metadata_key,
    @plan_customer_selectable_metadata_key,
    @plan_member_limit_metadata_key,
    @plan_storage_limit_bytes_metadata_key,
    @plan_metadata_version_metadata_key
  ]

  @doc """
  Builds the metadata Operately writes to Polar when creating managed products.

  That metadata is later used to recognize the product during sync and recover
  its local plan family, billing interval, and version.
  """
  def metadata(%PlanDefinition{} = plan_definition, billing_interval, version) do
    metadata(plan_definition.plan_key, billing_interval, version)
    |> Map.merge(%{
      @plan_display_name_metadata_key => plan_definition.display_name,
      @plan_tier_rank_metadata_key => plan_definition.tier_rank,
      @plan_customer_selectable_metadata_key => serialize_customer_selectable(plan_definition.customer_selectable),
      @plan_member_limit_metadata_key => serialize_limit(plan_definition.member_limit),
      @plan_storage_limit_bytes_metadata_key => serialize_limit(plan_definition.storage_limit_bytes),
      @plan_metadata_version_metadata_key => @plan_metadata_version
    })
  end

  def metadata(plan_family, billing_interval, version) do
    %{
      @managed_metadata_key => "true",
      @plan_family_metadata_key => Plans.normalize_key(plan_family),
      @billing_interval_metadata_key => format_billing_interval(billing_interval),
      @version_metadata_key => version
    }
  end

  @doc """
  Converts a Polar product payload into attrs for `billing_products`.

  Returns `{:ok, %{product_attrs: attrs, plan_definition_snapshot: snapshot_state}}`
  only for valid Operately-managed recurring products.
  Returns `:ignore` for unmanaged products or payloads that do not match the
  expected Operately metadata contract.
  """
  def normalize_provider_product(product) when is_map(product) do
    metadata = provider_metadata(product)

    with true <- managed_product?(metadata),
         {:ok, product_id} <- fetch_string(product, ["id"]),
         {:ok, name} <- fetch_string(product, ["name"]),
         {:ok, plan_family} <- normalize_plan_family(Map.get(metadata, @plan_family_metadata_key)),
         {:ok, billing_interval} <- normalize_billing_interval(Map.get(metadata, @billing_interval_metadata_key)),
         {:ok, recurring_interval} <- extract_recurring_interval(product),
         true <- recurring_interval == billing_interval,
         {:ok, version} <- extract_version(metadata) do
      {:ok,
       %{
         product_attrs: %{
           provider: "polar",
           plan_family: plan_family,
           billing_interval: billing_interval,
           polar_product_id: product_id,
           polar_product_name: name,
           price_amount: extract_price_amount(product),
           price_currency: extract_price_currency(product),
           version: version,
           archived_at: extract_archived_at(product),
           provider_payload: product,
           last_synced_at: DateTime.utc_now()
         },
         plan_definition_snapshot: extract_plan_definition_snapshot(metadata, plan_family)
       }}
    else
      false -> :ignore
      {:error, _} -> :ignore
    end
  end

  defp managed_product?(metadata) when is_map(metadata) do
    case Map.get(metadata, @managed_metadata_key) do
      true -> true
      "true" -> true
      "1" -> true
      1 -> true
      _ -> false
    end
  end

  defp provider_metadata(product) do
    case Map.get(product, "metadata") do
      metadata when is_map(metadata) -> metadata
      _ -> %{}
    end
  end

  defp extract_version(metadata) do
    case Map.get(metadata, @version_metadata_key) do
      nil ->
        {:error, :missing_version}

      version when is_integer(version) and version > 0 ->
        {:ok, version}

      version when is_binary(version) ->
        case Integer.parse(version) do
          {value, ""} when value > 0 -> {:ok, value}
          _ -> {:error, :invalid_version}
        end

      _ ->
        {:error, :invalid_version}
    end
  end

  defp extract_recurring_interval(product) do
    value =
      Map.get(product, "recurring_interval") ||
        Map.get(product, "recurringInterval") ||
        get_in(product, ["recurring", "interval"])

    normalize_billing_interval(value)
  end

  defp extract_archived_at(product) do
    archived_at =
      Map.get(product, "archived_at") ||
        Map.get(product, "archivedAt")

    if archived?(product) do
      archived_at || DateTime.utc_now()
    else
      archived_at
    end
    |> parse_datetime()
  end

  defp archived?(product) do
    archived_value =
      Map.get(product, "is_archived") ||
        Map.get(product, "isArchived") ||
        Map.get(product, "archived")

    archived_value in [true, "true", 1, "1"]
  end

  defp extract_price_amount(product) do
    product
    |> extract_price()
    |> case do
      nil ->
        nil

      price ->
        Map.get(price, "price_amount") ||
          Map.get(price, "priceAmount") ||
          Map.get(price, "amount")
    end
  end

  defp extract_price_currency(product) do
    product
    |> extract_price()
    |> case do
      nil ->
        nil

      price ->
        Map.get(price, "price_currency") ||
          Map.get(price, "priceCurrency") ||
          Map.get(price, "currency")
    end
    |> normalize_currency()
  end

  defp extract_price(product) do
    prices =
      Map.get(product, "prices") ||
        Map.get(product, "price_options") ||
        []

    Enum.find(prices, fn price ->
      amount_type = Map.get(price, "amount_type") || Map.get(price, "amountType")
      amount_type in [nil, "fixed"]
    end)
  end

  defp fetch_string(map, keys) do
    value = Enum.find_value(keys, fn key -> Map.get(map, key) end)

    if is_binary(value) and String.trim(value) != "" do
      {:ok, value}
    else
      {:error, :missing_value}
    end
  end

  defp normalize_plan_family(plan_family) do
    case Inputs.cast_provider_managed_plan_key(plan_family) do
      {:ok, normalized_plan_key} -> {:ok, normalized_plan_key}
      {:error, :invalid_plan_key} -> {:error, :invalid_plan_family}
    end
  end

  defp extract_plan_definition_snapshot(metadata, plan_family) do
    if Enum.any?(@plan_snapshot_metadata_keys, &Map.has_key?(metadata, &1)) do
      case parse_plan_definition_snapshot(metadata, plan_family) do
        {:ok, snapshot} -> {:valid, snapshot}
        {:error, reason} -> {:invalid, reason}
      end
    else
      :missing
    end
  end

  defp parse_plan_definition_snapshot(metadata, plan_family) do
    with {:ok, display_name} <- extract_plan_display_name(metadata),
         {:ok, tier_rank} <- extract_plan_tier_rank(metadata),
         {:ok, customer_selectable} <- extract_plan_customer_selectable(metadata),
         {:ok, member_limit} <- extract_plan_limit(metadata, @plan_member_limit_metadata_key),
         {:ok, storage_limit_bytes} <- extract_plan_limit(metadata, @plan_storage_limit_bytes_metadata_key),
         {:ok, metadata_version} <- extract_plan_metadata_version(metadata) do
      {:ok,
       %{
         plan_definition_attrs: %{
           plan_key: plan_family,
           display_name: display_name,
           tier_rank: tier_rank,
           billing_behavior: :provider_managed,
           customer_selectable: customer_selectable,
           member_limit: member_limit,
           storage_limit_bytes: storage_limit_bytes,
           archived_at: nil
         },
         metadata_version: metadata_version
       }}
    end
  end

  defp extract_plan_display_name(metadata) do
    case Map.get(metadata, @plan_display_name_metadata_key) do
      nil ->
        {:error, :missing_plan_display_name}

      value when is_binary(value) ->
        trimmed = String.trim(value)

        if trimmed == "" do
          {:error, :invalid_plan_display_name}
        else
          {:ok, trimmed}
        end

      _ ->
        {:error, :invalid_plan_display_name}
    end
  end

  defp extract_plan_tier_rank(metadata) do
    case Map.get(metadata, @plan_tier_rank_metadata_key) do
      nil -> {:error, :missing_plan_tier_rank}
      value -> parse_non_negative_integer(value, :invalid_plan_tier_rank)
    end
  end

  defp extract_plan_customer_selectable(metadata) do
    case Map.get(metadata, @plan_customer_selectable_metadata_key) do
      nil ->
        {:error, :missing_plan_customer_selectable}

      true ->
        {:ok, true}

      false ->
        {:ok, false}

      value when is_binary(value) ->
        case String.trim(value) |> String.downcase() do
          "true" -> {:ok, true}
          "false" -> {:ok, false}
          _ -> {:error, :invalid_plan_customer_selectable}
        end

      _ ->
        {:error, :invalid_plan_customer_selectable}
    end
  end

  defp extract_plan_limit(metadata, key) do
    case Map.get(metadata, key) do
      nil ->
        {:error, missing_limit_reason(key)}

      value when is_integer(value) and value > 0 ->
        {:ok, value}

      value when is_binary(value) ->
        trimmed = String.trim(value)

        cond do
          trimmed == "" ->
            {:error, invalid_limit_reason(key)}

          String.downcase(trimmed) == "unlimited" ->
            {:ok, nil}

          true ->
            parse_positive_integer(trimmed, invalid_limit_reason(key))
        end

      _ ->
        {:error, invalid_limit_reason(key)}
    end
  end

  defp extract_plan_metadata_version(metadata) do
    case Map.get(metadata, @plan_metadata_version_metadata_key) do
      nil -> {:error, :missing_plan_metadata_version}
      value -> parse_positive_integer(value, :invalid_plan_metadata_version)
    end
  end

  defp normalize_billing_interval(interval) when interval in @valid_billing_intervals, do: {:ok, interval}

  defp normalize_billing_interval(interval) when is_binary(interval) do
    interval
    |> String.downcase()
    |> case do
      "month" -> {:ok, :monthly}
      "monthly" -> {:ok, :monthly}
      "year" -> {:ok, :yearly}
      "yearly" -> {:ok, :yearly}
      _ -> {:error, :invalid_billing_interval}
    end
  end

  defp normalize_billing_interval(_), do: {:error, :invalid_billing_interval}

  defp normalize_currency(nil), do: nil
  defp normalize_currency(currency) when is_binary(currency), do: String.downcase(currency)
  defp normalize_currency(currency), do: to_string(currency) |> String.downcase()

  defp format_billing_interval(billing_interval) when is_atom(billing_interval), do: Atom.to_string(billing_interval)
  defp format_billing_interval(billing_interval), do: to_string(billing_interval)

  defp serialize_customer_selectable(true), do: "true"
  defp serialize_customer_selectable(false), do: "false"

  defp serialize_limit(nil), do: "unlimited"
  defp serialize_limit(limit), do: Integer.to_string(limit)

  defp parse_positive_integer(value, _error_reason) when is_integer(value) and value > 0, do: {:ok, value}

  defp parse_positive_integer(value, error_reason) when is_binary(value) do
    case Integer.parse(String.trim(value)) do
      {parsed, ""} when parsed > 0 -> {:ok, parsed}
      _ -> {:error, error_reason}
    end
  end

  defp parse_positive_integer(_, error_reason), do: {:error, error_reason}

  defp parse_non_negative_integer(value, _error_reason) when is_integer(value) and value >= 0, do: {:ok, value}

  defp parse_non_negative_integer(value, error_reason) when is_binary(value) do
    case Integer.parse(String.trim(value)) do
      {parsed, ""} when parsed >= 0 -> {:ok, parsed}
      _ -> {:error, error_reason}
    end
  end

  defp parse_non_negative_integer(_, error_reason), do: {:error, error_reason}

  defp missing_limit_reason(@plan_member_limit_metadata_key), do: :missing_plan_member_limit
  defp missing_limit_reason(@plan_storage_limit_bytes_metadata_key), do: :missing_plan_storage_limit_bytes

  defp invalid_limit_reason(@plan_member_limit_metadata_key), do: :invalid_plan_member_limit
  defp invalid_limit_reason(@plan_storage_limit_bytes_metadata_key), do: :invalid_plan_storage_limit_bytes

  defp parse_datetime(nil), do: nil
  defp parse_datetime(%DateTime{} = datetime), do: datetime

  defp parse_datetime(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, _offset} ->
        datetime

      _ ->
        case NaiveDateTime.from_iso8601(value) do
          {:ok, naive_datetime} -> DateTime.from_naive!(naive_datetime, "Etc/UTC")
          _ -> nil
        end
    end
  end

  defp parse_datetime(_), do: nil
end
