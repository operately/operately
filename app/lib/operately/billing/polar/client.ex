defmodule Operately.Billing.Polar.Client do
  @moduledoc false

  require Logger

  alias Operately.Billing.Polar.ProductMapper
  alias OperatelyWeb.Endpoint

  @default_base_url "https://api.polar.sh"

  def create_product(attrs) do
    post("/v1/products", create_product_payload(attrs))
  end

  def update_product(product_id, attrs) do
    patch("/v1/products/#{product_id}", update_product_payload(attrs))
  end

  def archive_product(product_id) do
    patch("/v1/products/#{product_id}", %{is_archived: true})
  end

  def list_products(opts \\ []) do
    params =
      case opts[:cursor] do
        nil -> %{limit: 100}
        cursor -> %{limit: 100, cursor: cursor}
      end

    with {:ok, body} <- get("/v1/products", params: params) do
      {:ok,
       %{
         items: extract_items(body),
         next_cursor: extract_next_cursor(body)
       }}
    end
  end

  def get_customer_state_by_external_id(external_id) when is_binary(external_id) do
    get("/v1/customers/external/#{URI.encode_www_form(external_id)}/state")
  end

  def create_customer_session(external_customer_id, return_url) when is_binary(external_customer_id) do
    post("/v1/customer-sessions", %{
      external_customer_id: external_customer_id,
      return_url: return_url
    })
  end

  def app_base_url do
    Endpoint.url()
  end

  defp create_product_payload(attrs) do
    metadata =
      ProductMapper.metadata(
        attrs.plan_family,
        attrs.billing_interval,
        attrs.version
      )

    %{
      name: attrs.polar_product_name,
      is_public: false,
      is_recurring: true,
      recurring_interval: billing_interval_to_polar(attrs.billing_interval),
      metadata: metadata,
      prices: [
        %{
          amount_type: "fixed",
          price_amount: attrs.price_amount,
          price_currency: normalize_currency(attrs.price_currency)
        }
      ]
    }
  end

  defp update_product_payload(attrs) do
    metadata =
      ProductMapper.metadata(
        attrs.plan_family,
        attrs.billing_interval,
        attrs.version
      )

    %{
      name: attrs.polar_product_name,
      is_public: false,
      metadata: metadata,
      prices: [
        %{
          amount_type: "fixed",
          price_amount: attrs.price_amount,
          price_currency: normalize_currency(attrs.price_currency)
        }
      ]
    }
  end

  defp get(path, opts \\ []), do: request(:get, path, opts)
  defp post(path, json), do: request(:post, path, json: json)
  defp patch(path, json), do: request(:patch, path, json: json)

  defp request(method, path, opts) do
    with {:ok, config} <- config() do
      request_opts =
        [
          method: method,
          url: config.base_url <> path,
          headers: [
            {"authorization", "Bearer #{config.access_token}"},
            {"accept", "application/json"},
            {"content-type", "application/json"}
          ]
        ]
        |> maybe_put(:json, opts[:json])
        |> maybe_put(:params, opts[:params])

      case Req.request(request_opts) do
        {:ok, %{status: status, body: body}} when status in 200..299 ->
          {:ok, body}

        {:ok, %{status: 404}} ->
          {:error, :not_found}

        {:ok, %{status: status, body: body}} when status in 400..499 ->
          Logger.warning("Polar request failed with 4xx response: #{inspect(%{status: status, body: body})}")
          {:error, :bad_request}

        {:ok, %{status: status, body: body}} when status >= 500 ->
          Logger.error("Polar request failed with 5xx response: #{inspect(%{status: status, body: body})}")
          {:error, :internal_server_error}

        {:error, reason} ->
          Logger.error("Polar request transport error: #{inspect(reason)}")
          {:error, :internal_server_error}
      end
    end
  end

  defp config do
    access_token = Application.get_env(:operately, :polar_access_token)

    if is_binary(access_token) and String.trim(access_token) != "" do
      {:ok, %{access_token: access_token, base_url: @default_base_url}}
    else
      Logger.error("Polar access token is not configured")
      {:error, :internal_server_error}
    end
  end

  defp extract_items(%{"items" => items}) when is_list(items), do: items
  defp extract_items(%{"products" => items}) when is_list(items), do: items
  defp extract_items(%{"data" => items}) when is_list(items), do: items
  defp extract_items(_), do: []

  defp extract_next_cursor(%{"pagination" => %{"next_cursor" => cursor}}), do: blank_to_nil(cursor)
  defp extract_next_cursor(%{"next_cursor" => cursor}), do: blank_to_nil(cursor)
  defp extract_next_cursor(%{"nextCursor" => cursor}), do: blank_to_nil(cursor)
  defp extract_next_cursor(_), do: nil

  defp billing_interval_to_polar(:monthly), do: "month"
  defp billing_interval_to_polar(:yearly), do: "year"

  defp normalize_currency(nil), do: "usd"
  defp normalize_currency(currency) when is_binary(currency), do: String.downcase(currency)
  defp normalize_currency(currency), do: currency |> to_string() |> String.downcase()

  defp maybe_put(keyword, _key, nil), do: keyword
  defp maybe_put(keyword, key, value), do: Keyword.put(keyword, key, value)

  defp blank_to_nil(value) when value in [nil, ""], do: nil
  defp blank_to_nil(value), do: value
end
