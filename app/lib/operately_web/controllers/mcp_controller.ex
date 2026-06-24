defmodule OperatelyWeb.McpController do
  @moduledoc """
  Streamable HTTP transport for the hosted MCP server at `/mcp`.

  Handles JSON-RPC requests for the foundation protocol methods (`initialize`,
  `notifications/initialized`, `ping`, and `tools/list`). Tool execution is added
  in a later layer.
  """
  use OperatelyWeb, :controller

  alias Operately.Mcp
  alias OperatelyWeb.Mcp.Tools
  alias OperatelyWeb.Mcp.Auth

  @jsonrpc_version "2.0"

  @doc """
  Handles MCP JSON-RPC POST requests (initialize, notifications, tool discovery, and future tools).
  """
  def post(conn, _params) do
    with :ok <- validate_post_headers(conn),
         {:ok, request} <- parse_jsonrpc_request(conn.body_params),
         {:ok, method} <- fetch_method(request),
         :ok <- ensure_required_scope(conn, method),
         response <- dispatch_request(conn, request, method) do
      response
    else
      # `ensure_required_scope/2` returns a halted conn instead of `{:error, _}`.
      %Plug.Conn{} = conn -> conn
      {:error, :invalid_request} -> jsonrpc_http_error(conn, 400, -32600, "Invalid Request")
      {:error, :unsupported_media_type} -> send_resp(conn, 415, "")
      {:error, :not_acceptable} -> send_resp(conn, 406, "")
    end
  end

  @doc """
  Rejects GET on an active MCP session. Streamable HTTP uses POST for messages.
  """
  def get(conn, _params) do
    with {:ok, _session} <- require_active_session(conn),
         :ok <- require_protocol_version(conn) do
      send_resp(conn, 405, "")
    else
      {:error, :missing_session} -> send_resp(conn, 400, "")
      {:error, :unknown_session} -> send_resp(conn, 404, "")
      {:error, :unsupported_protocol_version} -> send_resp(conn, 400, "")
    end
  end

  @doc """
  Closes the MCP session identified by `mcp-session-id`.
  """
  def delete(conn, _params) do
    with {:ok, session} <- require_active_session(conn),
         :ok <- require_protocol_version(conn),
         {:ok, _closed} <- Mcp.close_session(session) do
      send_resp(conn, 204, "")
    else
      {:error, :missing_session} -> send_resp(conn, 400, "")
      {:error, :unknown_session} -> send_resp(conn, 404, "")
      {:error, :unsupported_protocol_version} -> send_resp(conn, 400, "")
    end
  end

  # `initialize` creates the transport session and returns `mcp-session-id` for later calls.
  defp dispatch_request(conn, request, "initialize") do
    with {:ok, params} <- fetch_map(request, "params"),
         {:ok, protocol_version} <- fetch_required(params, "protocolVersion"),
         {:ok, client_info} <- fetch_map(params, "clientInfo"),
         {:ok, capabilities} <- optional_map(params, "capabilities"),
         {:ok, session} <-
           Mcp.create_session(conn.assigns.current_mcp_grant, conn.assigns.current_mcp_access_token, %{
             protocol_version: negotiate_protocol_version(protocol_version),
             client_info: client_info,
             client_capabilities: capabilities
           }) do
      conn
      |> put_resp_header("mcp-session-id", session.id)
      |> json(%{
        jsonrpc: @jsonrpc_version,
        id: request["id"],
        result: %{
          protocolVersion: negotiate_protocol_version(protocol_version),
          capabilities: %{"tools" => Tools.capabilities()},
          serverInfo: %{
            name: "operately",
            title: "Operately MCP",
            version: Operately.version(),
            websiteUrl: OperatelyWeb.Endpoint.url()
          }
        }
      })
    else
      {:error, _} -> jsonrpc_http_error(conn, 400, -32602, "Invalid params", request["id"])
    end
  end

  defp dispatch_request(conn, request, "notifications/initialized") do
    with {:ok, session} <- require_active_session(conn),
         :ok <- require_protocol_version(conn),
         {:ok, _session} <- Mcp.mark_session_initialized(session) do
      send_resp(conn, 202, "")
    else
      {:error, :missing_session} -> send_resp(conn, 400, "")
      {:error, :unknown_session} -> send_resp(conn, 404, "")
      {:error, :unsupported_protocol_version} -> send_resp(conn, 400, "")
      _ -> jsonrpc_http_error(conn, 400, -32602, "Invalid params", request["id"])
    end
  end

  defp dispatch_request(conn, request, "ping") do
    with {:ok, session} <- require_active_session(conn),
         :ok <- require_protocol_version(conn) do
      Mcp.touch_session(session)

      json(conn, %{
        jsonrpc: @jsonrpc_version,
        id: request["id"],
        result: %{}
      })
    else
      {:error, :missing_session} -> send_resp(conn, 400, "")
      {:error, :unknown_session} -> send_resp(conn, 404, "")
      {:error, :unsupported_protocol_version} -> send_resp(conn, 400, "")
    end
  end

  defp dispatch_request(conn, request, "tools/list") do
    with {:ok, _session} <- require_active_session(conn),
         :ok <- require_protocol_version(conn) do
      json(conn, %{
        jsonrpc: @jsonrpc_version,
        id: request["id"],
        result: %{
          tools: Tools.list_descriptors()
        }
      })
    else
      {:error, :missing_session} -> send_resp(conn, 400, "")
      {:error, :unknown_session} -> send_resp(conn, 404, "")
      {:error, :unsupported_protocol_version} -> send_resp(conn, 400, "")
    end
  end

  defp dispatch_request(conn, request, _method) do
    jsonrpc_http_error(conn, 200, -32601, "Method not found", request["id"])
  end

  defp ensure_required_scope(conn, method) do
    required_scopes =
      case method do
        "initialize" -> ["mcp:read"]
        "notifications/initialized" -> ["mcp:read"]
        "ping" -> ["mcp:read"]
        "tools/list" -> ["mcp:read"]
        _ -> ["mcp:read"]
      end

    if Enum.all?(required_scopes, &(&1 in (conn.assigns[:mcp_scopes] || []))) do
      :ok
    else
      Auth.insufficient_scope(conn, required_scopes, description: "Additional scope is required for this MCP operation.")
    end
  end

  defp validate_post_headers(conn) do
    accept_headers = get_req_header(conn, "accept")
    content_type_headers = get_req_header(conn, "content-type")

    # Streamable HTTP requires clients to accept both JSON responses and SSE.
    cond do
      not Enum.any?(accept_headers, &String.contains?(&1, "application/json")) -> {:error, :not_acceptable}
      not Enum.any?(accept_headers, &String.contains?(&1, "text/event-stream")) -> {:error, :not_acceptable}
      not Enum.any?(content_type_headers, &String.starts_with?(&1, "application/json")) -> {:error, :unsupported_media_type}
      true -> :ok
    end
  end

  defp parse_jsonrpc_request(body) when is_map(body) do
    if Map.get(body, "jsonrpc") == @jsonrpc_version or Map.get(body, :jsonrpc) == @jsonrpc_version do
      {:ok, stringify_keys(body)}
    else
      {:error, :invalid_request}
    end
  end

  defp fetch_method(%{"method" => method}) when is_binary(method), do: {:ok, method}
  defp fetch_method(_), do: {:error, :invalid_request}

  defp fetch_map(map, key) do
    case Map.get(map, key) do
      value when is_map(value) -> {:ok, stringify_keys(value)}
      _ -> {:error, :invalid_params}
    end
  end

  defp optional_map(map, key) do
    case Map.get(map, key) do
      nil -> {:ok, %{}}
      value when is_map(value) -> {:ok, stringify_keys(value)}
      _ -> {:error, :invalid_params}
    end
  end

  defp fetch_required(map, key) do
    case Map.get(map, key) do
      value when is_binary(value) and value != "" -> {:ok, value}
      _ -> {:error, :invalid_params}
    end
  end

  defp require_active_session(conn) do
    case get_req_header(conn, "mcp-session-id") do
      [session_id | _rest] ->
        case Mcp.get_session(session_id) do
          %Operately.Mcp.Session{} = session ->
            # Reject sessions from another grant or ones already closed via DELETE /mcp.
            if session.closed_at || session.grant_id != conn.assigns.current_mcp_grant.id do
              {:error, :unknown_session}
            else
              {:ok, session}
            end

          nil ->
            {:error, :unknown_session}
        end

      _ ->
        {:error, :missing_session}
    end
  end

  defp require_protocol_version(conn) do
    case get_req_header(conn, "mcp-protocol-version") do
      [version | _rest] ->
        if version == Mcp.latest_protocol_version() do
          :ok
        else
          {:error, :unsupported_protocol_version}
        end

      _ ->
        {:error, :unsupported_protocol_version}
    end
  end

  defp negotiate_protocol_version(_requested_version), do: Mcp.latest_protocol_version()

  defp jsonrpc_http_error(conn, status, code, message, id \\ nil) do
    conn
    |> put_status(status)
    |> json(%{
      jsonrpc: @jsonrpc_version,
      id: id,
      error: %{
        code: code,
        message: message
      }
    })
  end

  defp stringify_keys(map) do
    Map.new(map, fn {key, value} ->
      {
        if(is_atom(key), do: Atom.to_string(key), else: key),
        value
      }
    end)
  end
end
