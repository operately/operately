defmodule Operately.Mcp.ClientMetadata.Fetcher do
  alias Operately.Mcp.ClientMetadata.{Cache, SafeUrl}

  @doc """
  Fetches and caches a decoded CIMD metadata document.
  """
  def fetch(client_id) when is_binary(client_id) do
    case Cache.get(client_id) do
      {:ok, document} ->
        {:ok, document}

      :miss ->
        with :ok <- SafeUrl.validate(client_id),
             {:ok, body, headers} <- http_get(client_id),
             {:ok, document} <- decode_json(body),
             :ok <- Cache.put(client_id, document, cache_ttl(headers)) do
          {:ok, document}
        end
    end
  end

  def fetch(_), do: {:error, :fetch_failed}

  defp http_get(url) do
    case Req.get(url,
           redirect: false,
           decode_body: false,
           receive_timeout: fetch_timeout_ms(),
           max_body_size: max_response_bytes()
         ) do
      {:ok, %{status: 200, body: body, headers: headers}} when is_binary(body) ->
        {:ok, body, headers}

      {:ok, %{status: _status}} ->
        {:error, :invalid_response}

      {:error, _reason} ->
        {:error, :fetch_failed}
    end
  end

  defp decode_json(body) do
    case Jason.decode(body) do
      {:ok, document} when is_map(document) -> {:ok, document}
      _ -> {:error, :invalid_response}
    end
  end

  defp cache_ttl(headers) do
    headers
    |> normalize_headers()
    |> Map.get("cache-control")
    |> parse_max_age()
    |> case do
      nil -> default_cache_ttl_seconds()
      max_age -> min(max_age, max_age_cap_seconds())
    end
  end

  defp parse_max_age(nil), do: nil

  defp parse_max_age(cache_control) when is_binary(cache_control) do
    cache_control
    |> String.split(",")
    |> Enum.find_value(fn part ->
      part = String.trim(part)

      case String.split(part, "=", parts: 2) do
        ["max-age", value] ->
          case Integer.parse(String.trim(value)) do
            {max_age, ""} when max_age >= 0 -> max_age
            _ -> nil
          end

        _ ->
          nil
      end
    end)
  end

  defp normalize_headers(headers) when is_map(headers) do
    Map.new(headers, fn {key, value} ->
      key =
        case key do
          key when is_atom(key) -> key |> Atom.to_string() |> String.downcase()
          key when is_binary(key) -> String.downcase(key)
          key -> key
        end

      {key, List.first(List.wrap(value))}
    end)
  end

  defp fetch_timeout_ms, do: Application.get_env(:operately, :mcp_cimd_fetch_timeout_ms, 5_000)
  defp max_response_bytes, do: Application.get_env(:operately, :mcp_cimd_max_response_bytes, 32_768)
  defp default_cache_ttl_seconds, do: Application.get_env(:operately, :mcp_cimd_cache_ttl_seconds, 86_400)
  defp max_age_cap_seconds, do: Application.get_env(:operately, :mcp_cimd_cache_max_age_cap_seconds, 604_800)
end
