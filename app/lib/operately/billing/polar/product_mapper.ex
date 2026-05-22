defmodule Operately.Billing.Polar.ProductMapper do
  @moduledoc """
  Maps Polar product payloads to Operately's local billing catalog shape.

  This module is intentionally strict: it only accepts products that were
  created and tagged as Operately-managed. Manual Polar products are ignored
  rather than guessed from names or price data.
  """

  alias Operately.Billing.CompanyBillingAccount

  @valid_plan_keys CompanyBillingAccount.valid_plan_keys()
  @valid_billing_intervals CompanyBillingAccount.valid_billing_intervals()
  @managed_metadata_key "operately_managed"
  @plan_family_metadata_key "operately_plan_family"
  @billing_interval_metadata_key "operately_billing_interval"
  @version_metadata_key "operately_version"

  @doc """
  Builds the metadata Operately writes to Polar when creating managed products.

  That metadata is later used to recognize the product during sync and recover
  its local plan family, billing interval, and version.
  """
  def metadata(plan_family, billing_interval, version) do
    %{
      @managed_metadata_key => "true",
      @plan_family_metadata_key => Atom.to_string(plan_family),
      @billing_interval_metadata_key => Atom.to_string(billing_interval),
      @version_metadata_key => version
    }
  end

  @doc """
  Converts a Polar product payload into attrs for `billing_products`.

  Returns `{:ok, attrs}` only for valid Operately-managed recurring products.
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

  defp normalize_plan_family(plan_family) when plan_family in @valid_plan_keys, do: {:ok, plan_family}

  defp normalize_plan_family(plan_family) when is_binary(plan_family) do
    plan_family
    |> String.downcase()
    |> case do
      "team" -> {:ok, :team}
      "business" -> {:ok, :business}
      _ -> {:error, :invalid_plan_family}
    end
  end

  defp normalize_plan_family(_), do: {:error, :invalid_plan_family}

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
