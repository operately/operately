defmodule Operately.Mcp.ClientMetadata.Document do
  @moduledoc """
  Detects and parses Client ID Metadata Documents (CIMD) for MCP OAuth clients.

  Fetched document bodies are validated in this module; remote fetching lives in
  `Operately.Mcp.ClientMetadata.Fetcher`.
  """

  alias Operately.Mcp.ClientMetadata

  @doc """
  Returns true when `client_id` is an HTTPS metadata URL with a path.
  """
  def cimd_client_id?(client_id) when is_binary(client_id) do
    case URI.parse(client_id) do
      %URI{scheme: "https", host: host, path: path} when is_binary(host) and host != "" ->
        valid_path?(path)

      _ ->
        false
    end
  end

  def cimd_client_id?(_), do: false

  @doc """
  Parses a decoded CIMD JSON document into client metadata.
  """
  def parse(client_id, document) when is_binary(client_id) and is_map(document) do
    with {:ok, document_client_id} <- fetch_required_string(document, "client_id"),
         {:ok, client_name} <- fetch_required_string(document, "client_name"),
         {:ok, redirect_uris} <- fetch_redirect_uris(document),
         :ok <- validate_client_id_match(client_id, document_client_id),
         {:ok, metadata} <-
           ClientMetadata.build(%{
             client_id: normalize_client_id(client_id),
             client_name: client_name,
             client_uri: fetch_optional_string(document, "client_uri"),
             logo_uri: fetch_optional_string(document, "logo_uri"),
             redirect_uris: redirect_uris,
             token_endpoint_auth_method: Map.get(document, "token_endpoint_auth_method")
           }) do
      {:ok, metadata}
    else
      {:error, :unsupported_client_authentication} = error -> error
      {:error, _} -> {:error, :invalid_client_metadata}
    end
  end

  def parse(_, _), do: {:error, :invalid_client_metadata}

  defp valid_path?(path) when is_binary(path) do
    path != "" and path != "/"
  end

  defp valid_path?(_), do: false

  defp validate_client_id_match(client_id, document_client_id) do
    if normalize_client_id(client_id) == normalize_client_id(document_client_id) do
      :ok
    else
      {:error, :invalid_client_metadata}
    end
  end

  defp normalize_client_id(client_id) when is_binary(client_id) do
    client_id
    |> String.trim()
    |> String.trim_trailing("/")
  end

  defp fetch_required_string(document, key) do
    case Map.get(document, key) do
      value when is_binary(value) and value != "" -> {:ok, value}
      _ -> {:error, :invalid_client_metadata}
    end
  end

  defp fetch_optional_string(document, key) do
    case Map.get(document, key) do
      value when is_binary(value) and value != "" -> value
      _ -> nil
    end
  end

  defp fetch_redirect_uris(document) do
    case Map.get(document, "redirect_uris") do
      uris when is_list(uris) and uris != [] ->
        if Enum.all?(uris, &is_binary/1) do
          case validate_redirect_uri_schemes(uris) do
            :ok -> {:ok, uris}
            error -> error
          end
        else
          {:error, :invalid_client_metadata}
        end

      _ ->
        {:error, :invalid_client_metadata}
    end
  end

  defp validate_redirect_uri_schemes(uris) do
    if Enum.all?(uris, &redirect_uri_allowed?/1) do
      :ok
    else
      {:error, :invalid_client_metadata}
    end
  end

  defp redirect_uri_allowed?(uri) do
    case URI.parse(uri) do
      %URI{scheme: "https", host: host} when is_binary(host) and host != "" ->
        true

      %URI{scheme: "http", host: host} when is_binary(host) and host != "" ->
        not require_https_redirect_uris?() and ClientMetadata.localhost_redirect?(uri)

      _ ->
        false
    end
  end

  defp require_https_redirect_uris? do
    Application.get_env(
      :operately,
      :mcp_cimd_require_https_redirect_uris,
      Application.get_env(:operately, :app_env) == :prod
    )
  end
end
