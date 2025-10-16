defmodule OperatelyWeb.MCPOAuthController do
  use OperatelyWeb, :controller

  alias Operately.MCP.{OAuth, URL}
  alias OperatelyWeb.Paths

  plug :require_authenticated_account when action in [:authorize, :approve]

  def authorize(conn, params) do
    with {:ok, request} <- validate_authorize_params(conn, params) do
      render(conn, :authorize,
        company: conn.assigns[:current_company],
        person: conn.assigns[:current_person],
        client_id: request.client_id,
        redirect_uri: request.redirect_uri,
        scope: request.scope,
        state: request.state,
        code_challenge: request.code_challenge,
        code_challenge_method: request.code_challenge_method,
        resource: request.resource
      )
    else
      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "invalid_request", error_description: describe_error(reason)})
    end
  end

  def approve(conn, %{"decision" => "deny"} = params) do
    redirect_uri = params["redirect_uri"]
    state = params["state"]

    uri =
      redirect_uri
      |> URI.parse()
      |> add_query(%{"error" => "access_denied", "state" => state})
      |> URI.to_string()

    redirect(conn, external: uri)
  end

  def approve(conn, params) do
    with {:ok, request} <- validate_authorize_params(conn, params),
         {:ok, code} <- OAuth.issue_authorization_code(current_oauth_info(conn), params) do
      uri =
        request.redirect_uri
        |> URI.parse()
        |> add_query(%{"code" => code, "state" => request.state})
        |> URI.to_string()

      redirect(conn, external: uri)
    else
      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "invalid_request", error_description: describe_error(reason)})
    end
  end

  def token(conn, params) do
    conn = put_resp_header(conn, "cache-control", "no-store")

    case params["grant_type"] do
      "authorization_code" ->
        handle_authorization_code_grant(conn, params)

      "refresh_token" ->
        handle_refresh_token_grant(conn, params)

      _ ->
        render_token_error(conn, :unsupported_grant_type, "Unsupported grant type")
    end
  end

  def protected_resource_metadata(conn, _params) do
    company_slug = URL.company_slug(conn)

    json(conn, %{
      "resource" => URL.resource_uri(conn, company_slug),
      "authorization_servers" => [URL.authorization_server_metadata_uri(conn, company_slug)],
      "bearer_token_methods_supported" => ["authorization_header"],
      "scopes_supported" => ["mcp"]
    })
  end

  def authorization_server_metadata(conn, _params) do
    company_slug = URL.company_slug(conn)

    json(conn, %{
      "issuer" => URL.authorization_server_metadata_uri(conn, company_slug),
      "authorization_endpoint" => URL.authorize_endpoint(conn, company_slug),
      "token_endpoint" => URL.token_endpoint(conn, company_slug),
      "response_types_supported" => ["code"],
      "grant_types_supported" => ["authorization_code", "refresh_token"],
      "code_challenge_methods_supported" => ["S256"],
      "token_endpoint_auth_methods_supported" => ["none"],
      "scopes_supported" => ["mcp"],
      "claims_supported" => [],
      "revocation_endpoint" => URL.token_endpoint(conn, company_slug)
    })
  end

  defp handle_authorization_code_grant(conn, params) do
    with {:ok, request} <- validate_token_code_params(conn, params),
         {:ok, tokens} <- OAuth.exchange_code(request) do
      json(conn, serialize_token_response(tokens))
    else
      {:error, reason} ->
        render_token_error(conn, :invalid_grant, describe_error(reason))
    end
  end

  defp handle_refresh_token_grant(conn, params) do
    with {:ok, request} <- validate_refresh_params(conn, params),
         {:ok, tokens} <- OAuth.exchange_refresh_token(request) do
      json(conn, serialize_token_response(tokens))
    else
      {:error, reason} ->
        render_token_error(conn, :invalid_grant, describe_error(reason))
    end
  end

  defp validate_authorize_params(conn, params) do
    with %{"response_type" => "code"} <- params,
         %{"client_id" => client_id, "redirect_uri" => redirect_uri} <- params,
         %{"code_challenge" => code_challenge, "code_challenge_method" => method} <- params,
         resource when is_binary(resource) <- Map.get(params, "resource"),
         true <- resource == URL.resource_uri(conn, URL.company_slug(conn)) do
      {:ok,
       %{
         client_id: client_id,
         redirect_uri: redirect_uri,
         scope: Map.get(params, "scope"),
         state: Map.get(params, "state"),
         code_challenge: code_challenge,
         code_challenge_method: method,
         resource: resource
       }}
    else
      _ -> {:error, :invalid_request}
    end
  end

  defp validate_token_code_params(conn, params) do
    with %{
           "client_id" => client_id,
           "code" => code,
           "redirect_uri" => redirect_uri,
           "code_verifier" => code_verifier,
           "resource" => resource
         } <- params,
         true <- resource == URL.resource_uri(conn, URL.company_slug(conn)) do
      {:ok,
       %{
         client_id: client_id,
         code: code,
         code_verifier: code_verifier,
         redirect_uri: redirect_uri,
         resource: resource
       }}
    else
      _ -> {:error, :invalid_request}
    end
  end

  defp validate_refresh_params(conn, params) do
    with %{
           "client_id" => client_id,
           "refresh_token" => refresh_token,
           "resource" => resource
         } <- params,
         true <- resource == URL.resource_uri(conn, URL.company_slug(conn)) do
      {:ok,
       %{
         client_id: client_id,
         refresh_token: refresh_token,
         resource: resource
       }}
    else
      _ -> {:error, :invalid_request}
    end
  end

  defp current_oauth_info(conn) do
    %{
      account: conn.assigns[:current_account],
      company: conn.assigns[:current_company]
    }
  end

  defp serialize_token_response(tokens) do
    %{
      "access_token" => tokens.access_token,
      "refresh_token" => tokens.refresh_token,
      "token_type" => tokens.token_type,
      "expires_in" => tokens.expires_in,
      "scope" => tokens.scope,
      "resource" => tokens.resource
    }
  end

  defp render_token_error(conn, error, description) do
    body = %{
      "error" => to_string(error),
      "error_description" => description
    }

    conn
    |> put_status(:bad_request)
    |> json(body)
  end

  defp describe_error({:invalid_authorization_request, _changeset}), do: "Invalid authorization request"
  defp describe_error(:invalid_request), do: "Invalid request"
  defp describe_error(:invalid_grant), do: "Invalid grant"
  defp describe_error(:unsupported_challenge_method), do: "Unsupported code challenge method"
  defp describe_error(:invalid_token), do: "Invalid token"
  defp describe_error(other) when is_binary(other), do: other
  defp describe_error(_), do: "Authorization error"

  defp add_query(uri, params) do
    new_query =
      uri.query
      |> URI.decode_query(%{})
      |> Map.merge(Enum.reject(params, fn {_k, v} -> is_nil(v) end) |> Enum.into(%{}))
      |> URI.encode_query()

    %{uri | query: new_query}
  end
end
