defmodule OperatelyWeb.McpOAuthController do
  use OperatelyWeb, :controller

  alias Operately.Mcp
  alias Operately.Mcp.Observability
  alias OperatelyWeb.Paths

  plug OperatelyWeb.Mcp.Plugs.RateLimitOAuth, :oauth_authorize when action in [:authorize, :submit_authorization]
  plug OperatelyWeb.Mcp.Plugs.RateLimitOAuth, :oauth_token when action in [:token]

  def authorize(conn, params) do
    with {:ok, account} <- require_account(conn),
         {:ok, request} <- Mcp.authorize_client_request(params) do
      companies = Mcp.eligible_companies(account)

      case companies do
        [] ->
          render_error(conn, 403, "No Companies Found", "Your account is not associated with any active companies.")

        [company] ->
          render_consent(conn, request, company)

        companies ->
          render_company_picker(conn, request, companies)
      end
    else
      {:redirect, conn} -> conn
      {:error, reason} -> render_authorization_error(conn, reason)
    end
  end

  def submit_authorization(conn, params) do
    with {:ok, account} <- require_account(conn),
         {:ok, request} <- Mcp.authorize_client_request(params) do
      companies = Mcp.eligible_companies(account)

      case params["decision"] do
        "select_company" ->
          with {:ok, company} <- selected_company(companies, params) do
            render_consent(conn, request, company)
          else
            {:error, _} -> render_authorization_error(conn, :invalid_request)
          end

        "approve" ->
          with {:ok, company} <- selected_company(companies, params),
               {:ok, grant} <- Mcp.upsert_grant(account, company, request),
               {:ok, _code, raw_code} <- Mcp.issue_authorization_code(grant, request) do
            redirect(conn, external: append_query_params(request.redirect_uri, %{"code" => raw_code, "state" => request.state}))
          else
            {:error, reason} -> render_authorization_error(conn, reason)
          end

        "deny" ->
          redirect_oauth_error(conn, request.redirect_uri, "access_denied", request.state)

        _ ->
          render_authorization_error(conn, :invalid_request)
      end
    else
      {:redirect, conn} -> conn
      {:error, reason} -> render_authorization_error(conn, reason)
    end
  end

  def token(conn, params) do
    conn =
      conn
      |> put_resp_header("cache-control", "no-store")
      |> put_resp_header("pragma", "no-cache")

    case params["grant_type"] do
      "authorization_code" ->
        case Mcp.exchange_authorization_code(params) do
          {:ok, response} -> json(conn, oauth_token_response(response))
          {:error, reason} -> oauth_json_error(conn, reason)
        end

      "refresh_token" ->
        case Mcp.refresh_access_token(params) do
          {:ok, response} -> json(conn, oauth_token_response(response))
          {:error, reason} -> oauth_json_error(conn, reason)
        end

      _ ->
        oauth_json_error(conn, :unsupported_grant_type)
    end
  end

  def register(conn, params) do
    conn =
      conn
      |> put_resp_header("cache-control", "no-store")
      |> put_resp_header("pragma", "no-cache")

    case Mcp.register_oauth_client(params) do
      {:ok, response} ->
        conn
        |> put_status(201)
        |> json(response)

      {:error, reason} ->
        Observability.oauth_register(%{result: reason})
        registration_json_error(conn, reason)
    end
  end

  defp oauth_token_response(response) do
    %{
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      token_type: response.token_type,
      expires_in: response.expires_in,
      scope: response.scope
    }
  end

  defp require_account(conn) do
    case conn.assigns[:current_account] do
      nil ->
        encoded_path = URI.encode_www_form(current_path(conn))
        {:redirect, redirect(conn, to: Paths.login_path() <> "?redirect_to=" <> encoded_path)}

      account ->
        {:ok, account}
    end
  end

  defp selected_company([company], _params), do: {:ok, company}

  defp selected_company(companies, params) do
    company_id = params["selected_company_id"]

    Enum.find(companies, &(&1.id == company_id))
    |> case do
      nil -> {:error, :invalid_request}
      company -> {:ok, company}
    end
  end

  defp append_query_params(uri, params) do
    uri = URI.parse(uri)
    existing_params = if uri.query, do: URI.decode_query(uri.query), else: %{}

    query =
      existing_params
      |> Map.merge(Enum.reject(params, fn {_key, value} -> is_nil(value) end) |> Map.new())
      |> URI.encode_query()

    %{uri | query: query}
    |> URI.to_string()
  end

  defp redirect_oauth_error(conn, redirect_uri, error, state) do
    redirect(conn, external: append_query_params(redirect_uri, %{"error" => error, "state" => state}))
  end

  defp render_company_picker(conn, request, companies) do
    conn
    |> put_view(OperatelyWeb.McpOAuthHTML)
    |> render(:company_picker,
      title: "Choose a Company",
      request: request,
      companies: companies,
      hidden_fields: hidden_fields(request)
    )
  end

  defp render_consent(conn, request, company) do
    conn
    |> put_view(OperatelyWeb.McpOAuthHTML)
    |> render(:consent,
      title: "Authorize MCP Client",
      request: request,
      company: company,
      hidden_fields: Map.put(hidden_fields(request), "selected_company_id", company.id),
      localhost_warning: Mcp.localhost_redirect?(request.redirect_uri),
      client_host: client_host(request),
      redirect_host: redirect_host(request.redirect_uri)
    )
  end

  defp render_authorization_error(conn, reason) do
    Observability.oauth_authorize(%{
      result: reason,
      client_id: conn.params["client_id"]
    })

    case reason do
      :invalid_redirect_uri -> render_error(conn, 400, "Invalid Redirect URI", "The requested redirect URI is not registered for this client.")
      :invalid_target_resource -> render_error(conn, 400, "Invalid Resource", "The authorization request must target this server's canonical MCP endpoint.")
      :invalid_scope -> render_error(conn, 400, "Invalid Scope", "The authorization request contains an unsupported scope.")
      :missing_code_challenge -> render_error(conn, 400, "Missing PKCE Challenge", "This authorization request must include a PKCE code challenge.")
      :unsupported_code_challenge_method -> render_error(conn, 400, "Unsupported PKCE Method", "Only the S256 PKCE challenge method is supported.")
      :unsupported_client_authentication -> render_error(conn, 400, "Unsupported Client Authentication", "Only public OAuth clients using token_endpoint_auth_method=none are supported.")
      :invalid_client -> render_error(conn, 400, "Invalid Client", "The OAuth client is not registered for this Operately MCP server.")
      :invalid_request -> render_error(conn, 400, "Invalid Request", "The authorization request is missing required parameters or contains invalid values.")
      _ -> render_error(conn, 500, "Authorization Error", "Operately couldn't complete this authorization request.")
    end
  end

  defp render_error(conn, status, title, message) do
    conn
    |> put_status(status)
    |> put_view(OperatelyWeb.McpOAuthHTML)
    |> render(:error, title: title, message: message)
  end

  defp oauth_json_error(conn, reason) do
    {status, error, description} =
      case reason do
        :invalid_client -> {401, "invalid_client", "The client could not be authenticated."}
        :invalid_target_resource -> {400, "invalid_target_resource", "The requested resource does not match this MCP server."}
        :invalid_grant -> {400, "invalid_grant", "The supplied authorization grant is invalid, expired, or has already been used."}
        :unsupported_grant_type -> {400, "unsupported_grant_type", "The token endpoint only supports authorization_code and refresh_token grants."}
        :invalid_request -> {400, "invalid_request", "The token request is missing required parameters or contains invalid values."}
        _ -> {400, "invalid_request", "The token request could not be completed."}
      end

    Observability.oauth_token(%{
      result: reason,
      client_id: conn.params["client_id"],
      grant_type: conn.params["grant_type"]
    })

    conn
    |> put_status(status)
    |> json(%{error: error, error_description: description})
  end

  defp registration_json_error(conn, reason) do
    {status, error, description} =
      case reason do
        :invalid_redirect_uri ->
          {400, "invalid_redirect_uri", "One or more redirect URIs are not allowed for this MCP server."}

        :unsupported_client_authentication ->
          {400, "invalid_client_metadata", "Only public OAuth clients using token_endpoint_auth_method=none are supported."}

        :invalid_client_metadata ->
          {400, "invalid_client_metadata", "The client registration request is missing required fields or contains invalid values."}

        _ ->
          {400, "invalid_client_metadata", "The client registration request could not be completed."}
      end

    conn
    |> put_status(status)
    |> json(%{error: error, error_description: description})
  end

  defp hidden_fields(request) do
    %{
      "client_id" => request.client_id,
      "redirect_uri" => request.redirect_uri,
      "resource" => request.resource,
      "scope" => request.scope_string,
      "state" => request.state,
      "code_challenge" => request.code_challenge,
      "code_challenge_method" => request.code_challenge_method
    }
  end

  defp client_host(request) do
    case URI.parse(request.client.client_id) do
      %URI{host: host} when is_binary(host) and host != "" -> host
      _ -> request.client.client_id
    end
  end

  defp redirect_host(redirect_uri) do
    case URI.parse(redirect_uri) do
      %URI{host: host} when is_binary(host) and host != "" -> host
      _ -> redirect_uri
    end
  end
end
