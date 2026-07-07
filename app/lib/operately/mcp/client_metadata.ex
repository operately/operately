defmodule Operately.Mcp.ClientMetadata do
  @moduledoc """
  Resolves OAuth client metadata for the MCP authorization flow.

  Pre-registered clients come from `:mcp_oauth_clients`. CIMD clients are
  resolved by fetching and parsing a Client ID Metadata Document.
  """

  defstruct [:client_id, :client_name, :client_uri, :logo_uri, :token_endpoint_auth_method, redirect_uris: []]

  alias __MODULE__
  alias Operately.Mcp.ClientMetadata.{Document, Fetcher}
  alias Operately.Mcp.OAuthClient
  alias Operately.Mcp.Observability
  alias Operately.Repo

  @localhost_hosts ["localhost", "127.0.0.1", "::1"]

  @doc """
  Resolves one OAuth client definition from the allowlist or a CIMD document.
  """
  def resolve(client_id) when is_binary(client_id) do
    case configured_clients() |> Enum.find_value(&match_client(&1, client_id)) do
      %ClientMetadata{} = metadata ->
        validate_auth_method(metadata)

      nil ->
        cond do
          Document.cimd_client_id?(client_id) -> resolve_cimd(client_id)
          true -> resolve_registered(client_id)
        end
    end
  end

  @doc """
  Builds validated client metadata from attributes.
  """
  def build(attrs) when is_map(attrs) do
    metadata = %ClientMetadata{
      client_id: fetch_value(attrs, :client_id),
      client_name: fetch_value(attrs, :client_name),
      client_uri: fetch_value(attrs, :client_uri),
      logo_uri: fetch_value(attrs, :logo_uri),
      redirect_uris: fetch_value(attrs, :redirect_uris) || [],
      token_endpoint_auth_method: fetch_value(attrs, :token_endpoint_auth_method) || "none"
    }

    validate_auth_method(metadata)
  end

  def validate_auth_method(%ClientMetadata{token_endpoint_auth_method: method} = metadata) do
    if method in [nil, "none"] do
      {:ok, %ClientMetadata{metadata | token_endpoint_auth_method: method || "none"}}
    else
      {:error, :unsupported_client_authentication}
    end
  end

  @doc """
  Confirms that the requested redirect URI is one of the client's registered
  redirect URIs.
  """
  def validate_redirect_uri(%ClientMetadata{} = metadata, redirect_uri) when is_binary(redirect_uri) do
    if redirect_uri in metadata.redirect_uris do
      :ok
    else
      {:error, :invalid_redirect_uri}
    end
  end

  @doc """
  Returns true when the redirect URI points to localhost or a loopback address.

  This is used to show a warning on the consent screen for local clients.
  """
  def localhost_redirect?(uri) when is_binary(uri) do
    case URI.parse(uri) do
      %URI{host: host} when host in @localhost_hosts -> true
      _ -> false
    end
  end

  defp configured_clients do
    Application.get_env(:operately, :mcp_oauth_clients, [])
  end

  defp resolve_registered(client_id) do
    if registered_client_id?(client_id) do
      case Repo.get(OAuthClient, client_id) do
        %OAuthClient{} = client ->
          build(%{
            client_id: client.id,
            client_name: client.client_name,
            client_uri: client.client_uri,
            logo_uri: client.logo_uri,
            redirect_uris: client.redirect_uris,
            token_endpoint_auth_method: client.token_endpoint_auth_method
          })

        nil ->
          {:error, :invalid_client}
      end
    else
      {:error, :invalid_client}
    end
  end

  defp registered_client_id?(client_id) when is_binary(client_id) do
    match?({:ok, _}, Ecto.UUID.cast(client_id))
  end

  defp resolve_cimd(client_id) do
    if Document.cimd_client_id?(client_id) do
      with {:ok, document} <- Fetcher.fetch(client_id),
           {:ok, metadata} <- Document.parse(client_id, document) do
        validate_auth_method(metadata)
      else
        {:error, :unsupported_client_authentication} = error ->
          error

        {:error, reason} ->
          unless reason in [:fetch_failed, :invalid_response, :unsafe_url] do
            Observability.cimd_fetch(%{
              client_id: client_id,
              result: Observability.cimd_result(reason),
              cache: "miss"
            })
          end

          {:error, :invalid_client}
      end
    else
      {:error, :invalid_client}
    end
  end

  defp match_client(client, client_id) do
    if fetch_value(client, :client_id) == client_id do
      build_metadata(client)
    end
  end

  defp build_metadata(client) do
    %ClientMetadata{
      client_id: fetch_value(client, :client_id),
      client_name: fetch_value(client, :client_name),
      client_uri: fetch_value(client, :client_uri),
      logo_uri: fetch_value(client, :logo_uri),
      redirect_uris: fetch_value(client, :redirect_uris) || [],
      token_endpoint_auth_method: fetch_value(client, :token_endpoint_auth_method) || "none"
    }
  end

  defp fetch_value(map, key) when is_map(map) and is_atom(key) do
    Map.get(map, key) || Map.get(map, Atom.to_string(key))
  end
end
