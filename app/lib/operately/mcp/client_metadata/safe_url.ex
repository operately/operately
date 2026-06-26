defmodule Operately.Mcp.ClientMetadata.SafeUrl do
  @moduledoc false

  alias Operately.Mcp.ClientMetadata.Document

  @blocked_hostnames ~w(localhost metadata.google.internal)

  @doc """
  Validates that a CIMD client URL is safe to fetch.
  """
  def validate(client_id) when is_binary(client_id) do
    with true <- Document.cimd_client_id?(client_id) or {:error, :unsafe_url},
         %URI{} = uri <- URI.parse(client_id),
         :ok <- validate_port(uri),
         :ok <- validate_hostname(uri.host),
         :ok <- validate_host_address(uri.host),
         :ok <- validate_resolved_addresses(uri.host) do
      :ok
    else
      {:error, reason} -> {:error, reason}
    end
  end

  def validate(_), do: {:error, :unsafe_url}

  defp validate_port(%URI{port: nil}), do: :ok
  defp validate_port(%URI{port: 443}), do: :ok
  defp validate_port(_), do: {:error, :unsafe_url}

  defp validate_hostname(host) when host in @blocked_hostnames, do: {:error, :unsafe_url}
  defp validate_hostname("127.0.0.1"), do: {:error, :unsafe_url}
  defp validate_hostname("::1"), do: {:error, :unsafe_url}
  defp validate_hostname(_), do: :ok

  defp validate_host_address(host) do
    case :inet.parse_address(String.to_charlist(host)) do
      {:ok, address} ->
        if private_ip?(address), do: {:error, :unsafe_url}, else: :ok

      {:error, :einval} ->
        :ok
    end
  end

  defp validate_resolved_addresses(host) do
    case dns_lookup(host) do
      {:ok, {:hostent, _name, _aliases, _addrtype, _length, addresses}} ->
        if Enum.any?(addresses, &private_ip?/1) do
          {:error, :unsafe_url}
        else
          :ok
        end

      {:error, _} ->
        {:error, :unsafe_url}
    end
  end

  defp dns_lookup(host) do
    case Application.get_env(:operately, :mcp_cimd_dns_lookup) do
      fun when is_function(fun, 1) -> fun.(host)
      _ -> :inet.gethostbyname(String.to_charlist(host))
    end
  end

  defp private_ip?({a, b, _c, _d}) do
    cond do
      a == 127 -> true
      a == 10 -> true
      a == 172 and b in 16..31 -> true
      a == 192 and b == 168 -> true
      a == 169 and b == 254 -> true
      a == 0 -> true
      true -> false
    end
  end

  defp private_ip?({0, 0, 0, 0, 0, 0, 0, 1}), do: true
  defp private_ip?({254, 128, _, _, _, _, _, _}), do: true
  defp private_ip?({252, _, _, _, _, _, _, _}), do: true
  defp private_ip?({253, _, _, _, _, _, _, _}), do: true
  defp private_ip?(_), do: false
end
