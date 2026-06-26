defmodule Operately.Mcp.ClientMetadata.Document do
  @moduledoc """
  Detects and parses Client ID Metadata Documents (CIMD) for MCP OAuth clients.

  Fetched document bodies are validated locally here; remote fetching is handled
  in a later phase.
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
          {:ok, uris}
        else
          {:error, :invalid_client_metadata}
        end

      _ ->
        {:error, :invalid_client_metadata}
    end
  end
end
