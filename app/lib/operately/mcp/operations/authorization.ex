defmodule Operately.Mcp.Operations.Authorization do
  alias Operately.Mcp.{ClientMetadata, Resources}

  @code_challenge_method "S256"

  @doc """
  Validates an OAuth authorization request and returns normalized client details.
  """
  def authorize_client_request(params) do
    with {:ok, client_id} <- fetch_required(params, "client_id"),
         {:ok, redirect_uri} <- fetch_required(params, "redirect_uri"),
         {:ok, resource} <- fetch_required(params, "resource"),
         true <- Resources.resource_valid?(resource) or {:error, :invalid_target_resource},
         {:ok, scopes} <- Resources.parse_scopes(Map.get(params, "scope")),
         {:ok, code_challenge} <- fetch_required(params, "code_challenge"),
         {:ok, code_challenge_method} <- fetch_required(params, "code_challenge_method"),
         :ok <- validate_code_challenge(code_challenge, code_challenge_method),
         {:ok, client} <- ClientMetadata.resolve(client_id),
         :ok <- ClientMetadata.validate_redirect_uri(client, redirect_uri) do
      {:ok,
       %{
         client: client,
         client_id: client_id,
         redirect_uri: redirect_uri,
         resource: Resources.normalize_resource_uri(resource),
         scopes: scopes,
         scope_string: Resources.scopes_to_string(scopes),
         code_challenge: code_challenge,
         code_challenge_method: code_challenge_method,
         state: Map.get(params, "state")
       }}
    end
  end

  defp validate_code_challenge(code_challenge, code_challenge_method)
       when is_binary(code_challenge) and is_binary(code_challenge_method) do
    cond do
      String.trim(code_challenge) == "" -> {:error, :missing_code_challenge}
      code_challenge_method != @code_challenge_method -> {:error, :unsupported_code_challenge_method}
      true -> :ok
    end
  end

  defp validate_code_challenge(_, _), do: {:error, :missing_code_challenge}

  defp fetch_required(map, key) when is_map(map) do
    case Map.get(map, key) do
      value when is_binary(value) and value != "" -> {:ok, value}
      _ -> {:error, :invalid_request}
    end
  end
end
