defmodule Operately.Mcp.Operations.ClientRegistration do
  @moduledoc """
  Implements OAuth 2.0 Dynamic Client Registration (RFC 7591) for MCP.

  IDE and CLI clients such as Cursor and Codex call `POST /oauth/register` before
  starting the authorization flow. This module validates the request, persists a
  public OAuth client, and returns the issued `client_id`.

  Registration steps:

  1. Require `client_name` and `redirect_uris`
  2. Validate redirect URIs against `RedirectUri` (HTTPS, loopback, or known native callbacks)
  3. Require `token_endpoint_auth_method` to be `"none"`
  4. Insert an `OAuthClient` record and return RFC 7591 registration metadata
  """

  alias Operately.Mcp.ClientMetadata.RedirectUri
  alias Operately.Mcp.OAuthClient
  alias Operately.Repo

  @default_grant_types ["authorization_code"]
  @default_response_types ["code"]

  def register(params) when is_map(params) do
    with {:ok, client_name} <- fetch_required_string(params, "client_name"),
         {:ok, redirect_uris} <- fetch_redirect_uris(params),
         :ok <- validate_token_endpoint_auth_method(params),
         {:ok, client} <-
           %OAuthClient{}
           |> OAuthClient.changeset(%{
             client_name: client_name,
             client_uri: fetch_optional_string(params, "client_uri"),
             logo_uri: fetch_optional_string(params, "logo_uri"),
             redirect_uris: redirect_uris,
             token_endpoint_auth_method: token_endpoint_auth_method(params),
             grant_types: grant_types(params),
             response_types: response_types(params)
           })
           |> Repo.insert() do
      {:ok, registration_response(client)}
    else
      {:error, %Ecto.Changeset{}} -> {:error, :invalid_client_metadata}
      {:error, reason} -> {:error, reason}
    end
  end

  def registration_response(%OAuthClient{} = client) do
    client_id = client.id
    issued_at = client.inserted_at |> DateTime.from_naive!("Etc/UTC") |> DateTime.to_unix(:second)

    %{
      client_id: client_id,
      client_id_issued_at: issued_at,
      client_name: client.client_name,
      client_uri: client.client_uri,
      logo_uri: client.logo_uri,
      redirect_uris: client.redirect_uris,
      grant_types: client.grant_types,
      response_types: client.response_types,
      token_endpoint_auth_method: client.token_endpoint_auth_method
    }
    |> Enum.reject(fn {_key, value} -> is_nil(value) end)
    |> Map.new()
  end

  defp fetch_redirect_uris(params) do
    case Map.get(params, "redirect_uris") do
      uris when is_list(uris) ->
        if Enum.all?(uris, &is_binary/1) do
          case RedirectUri.validate_all(uris) do
            :ok -> {:ok, uris}
            error -> error
          end
        else
          {:error, :invalid_redirect_uri}
        end

      _ ->
        {:error, :invalid_redirect_uri}
    end
  end

  defp validate_token_endpoint_auth_method(params) do
    case token_endpoint_auth_method(params) do
      "none" -> :ok
      _ -> {:error, :unsupported_client_authentication}
    end
  end

  defp token_endpoint_auth_method(params) do
    case Map.get(params, "token_endpoint_auth_method") do
      nil -> "none"
      method when is_binary(method) -> method
      _ -> "invalid"
    end
  end

  defp grant_types(params) do
    case Map.get(params, "grant_types") do
      types when is_list(types) and types != [] -> types
      _ -> @default_grant_types
    end
  end

  defp response_types(params) do
    case Map.get(params, "response_types") do
      types when is_list(types) and types != [] -> types
      _ -> @default_response_types
    end
  end

  defp fetch_required_string(params, key) do
    case Map.get(params, key) do
      value when is_binary(value) and value != "" -> {:ok, value}
      _ -> {:error, :invalid_client_metadata}
    end
  end

  defp fetch_optional_string(params, key) do
    case Map.get(params, key) do
      value when is_binary(value) and value != "" -> value
      _ -> nil
    end
  end
end
