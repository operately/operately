defmodule OperatelyWeb.McpController do
  @moduledoc """
  Streamable HTTP transport for the hosted MCP server at `/mcp`.

  Handles JSON-RPC requests for the foundation protocol methods (`initialize`,
  `notifications/initialized`, `ping`, `tools/list`, and `tools/call`).
  """
  use OperatelyWeb, :controller

  alias Operately.Mcp
  alias OperatelyWeb.Mcp.Tools
  alias OperatelyWeb.Mcp.Auth
  alias OperatelyWeb.Mcp.Executor
  alias Operately.Mcp.Observability

  @jsonrpc_version "2.0"

  @doc """
  Handles MCP JSON-RPC POST requests (initialize, notifications, tool discovery, and future tools).
  """
  def post(conn, _params) do
    with :ok <- validate_post_headers(conn),
         {:ok, request} <- parse_jsonrpc_request(conn.body_params),
         {:ok, method} <- fetch_method(request),
         :ok <- ensure_method_scope(conn, method),
         response <- dispatch_request(conn, request, method) do
      response
    else
      # Scope checks return a halted conn instead of `{:error, _}`.
      %Plug.Conn{status: 403} = conn ->
        observe_method_scope_denied(conn, conn.body_params["method"])
        conn

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

  def cors_preflight(conn, _params) do
    send_resp(conn, 204, "")
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
      observe_rpc(conn, "initialize", "ok")

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
      {:error, _} ->
        observe_rpc(conn, "initialize", "invalid_params")
        jsonrpc_http_error(conn, 400, -32602, "Invalid params", request["id"])
    end
  end

  defp dispatch_request(conn, request, "notifications/initialized") do
    with {:ok, session} <- require_active_session(conn),
         :ok <- require_protocol_version(conn),
         {:ok, _session} <- Mcp.mark_session_initialized(session) do
      observe_rpc(conn, "notifications/initialized", "ok")
      send_resp(conn, 202, "")
    else
      {:error, :missing_session} ->
        observe_rpc(conn, "notifications/initialized", "protocol_error")
        send_resp(conn, 400, "")

      {:error, :unknown_session} ->
        observe_rpc(conn, "notifications/initialized", "protocol_error")
        send_resp(conn, 404, "")

      {:error, :unsupported_protocol_version} ->
        observe_rpc(conn, "notifications/initialized", "protocol_error")
        send_resp(conn, 400, "")

      _ ->
        observe_rpc(conn, "notifications/initialized", "invalid_params")
        jsonrpc_http_error(conn, 400, -32602, "Invalid params", request["id"])
    end
  end

  defp dispatch_request(conn, request, "ping") do
    with {:ok, session} <- require_active_session(conn),
         :ok <- require_protocol_version(conn) do
      Mcp.touch_session(session)
      observe_rpc(conn, "ping", "ok")

      json(conn, %{
        jsonrpc: @jsonrpc_version,
        id: request["id"],
        result: %{}
      })
    else
      {:error, :missing_session} ->
        observe_rpc(conn, "ping", "protocol_error")
        send_resp(conn, 400, "")

      {:error, :unknown_session} ->
        observe_rpc(conn, "ping", "protocol_error")
        send_resp(conn, 404, "")

      {:error, :unsupported_protocol_version} ->
        observe_rpc(conn, "ping", "protocol_error")
        send_resp(conn, 400, "")
    end
  end

  defp dispatch_request(conn, request, "tools/list") do
    with {:ok, _session} <- require_active_session(conn),
         :ok <- require_protocol_version(conn) do
      observe_rpc(conn, "tools/list", "ok")

      json(conn, %{
        jsonrpc: @jsonrpc_version,
        id: request["id"],
        result: %{
          tools: Tools.list_descriptors()
        }
      })
    else
      {:error, :missing_session} ->
        observe_rpc(conn, "tools/list", "protocol_error")
        send_resp(conn, 400, "")

      {:error, :unknown_session} ->
        observe_rpc(conn, "tools/list", "protocol_error")
        send_resp(conn, 404, "")

      {:error, :unsupported_protocol_version} ->
        observe_rpc(conn, "tools/list", "protocol_error")
        send_resp(conn, 400, "")
    end
  end

  defp dispatch_request(conn, request, "tools/call") do
    start_time = System.monotonic_time()

    with {:ok, _session} <- require_active_session(conn),
         :ok <- require_protocol_version(conn),
         {:ok, name, arguments} <- fetch_tool_call_params(request),
         {:ok, definition} <- Executor.fetch_definition(name),
         :ok <- ensure_scopes(conn, definition.required_scopes),
         {:ok, result} <- Executor.execute(conn, definition, arguments) do
      observe_tools_call(conn, name, Observability.tools_call_outcome(result), definition, start_time)

      json(conn, %{
        jsonrpc: @jsonrpc_version,
        id: request["id"],
        result: result
      })
    else
      {:error, :missing_session} ->
        observe_tools_call(conn, tool_name_from_request(request), "protocol_error", nil, start_time)
        send_resp(conn, 400, "")

      {:error, :unknown_session} ->
        observe_tools_call(conn, tool_name_from_request(request), "protocol_error", nil, start_time)
        send_resp(conn, 404, "")

      {:error, :unsupported_protocol_version} ->
        observe_tools_call(conn, tool_name_from_request(request), "protocol_error", nil, start_time)
        send_resp(conn, 400, "")

      {:error, :unknown_tool} ->
        observe_tools_call(conn, tool_name_from_request(request), "unknown_tool", nil, start_time)
        jsonrpc_http_error(conn, 200, -32602, "Invalid params", request["id"])

      {:error, :invalid_arguments} ->
        observe_tools_call(conn, tool_name_from_request(request), "invalid_params", nil, start_time)
        jsonrpc_http_error(conn, 200, -32602, "Invalid params", request["id"])

      {:error, :bad_request} ->
        observe_tools_call(conn, tool_name_from_request(request), "invalid_params", nil, start_time)
        jsonrpc_http_error(conn, 200, -32602, "Invalid params", request["id"])

      {:error, :invalid_params} ->
        observe_tools_call(conn, tool_name_from_request(request), "invalid_params", nil, start_time)
        jsonrpc_http_error(conn, 200, -32602, "Invalid params", request["id"])

      {:error, {:missing_required_key, _key}} ->
        observe_tools_call(conn, tool_name_from_request(request), "invalid_params", nil, start_time)
        jsonrpc_http_error(conn, 200, -32602, "Invalid params", request["id"])

      {:error, {:unexpected_key, _key}} ->
        observe_tools_call(conn, tool_name_from_request(request), "invalid_params", nil, start_time)
        jsonrpc_http_error(conn, 200, -32602, "Invalid params", request["id"])

      {:error, {:invalid_type, _key, _type}} ->
        observe_tools_call(conn, tool_name_from_request(request), "invalid_params", nil, start_time)
        jsonrpc_http_error(conn, 200, -32602, "Invalid params", request["id"])

      {:error, {:invalid_format, _key, _format}} ->
        observe_tools_call(conn, tool_name_from_request(request), "invalid_params", nil, start_time)
        jsonrpc_http_error(conn, 200, -32602, "Invalid params", request["id"])

      {:error, {:invalid_enum, _key}} ->
        observe_tools_call(conn, tool_name_from_request(request), "invalid_params", nil, start_time)
        jsonrpc_http_error(conn, 200, -32602, "Invalid params", request["id"])

      {:error, :invalid_schema} ->
        observe_tools_call(conn, tool_name_from_request(request), "internal_error", nil, start_time)
        jsonrpc_http_error(conn, 500, -32603, "Internal error", request["id"])

      {:error, :authenticated_conn_required} ->
        observe_tools_call(conn, tool_name_from_request(request), "internal_error", nil, start_time)
        jsonrpc_http_error(conn, 500, -32603, "Internal error", request["id"])

      {:error, _reason} ->
        observe_tools_call(conn, tool_name_from_request(request), "internal_error", nil, start_time)
        jsonrpc_http_error(conn, 500, -32603, "Internal error", request["id"])

      %Plug.Conn{status: 403} = halted_conn ->
        observe_tools_call(conn, tool_name_from_request(request), "insufficient_scope", nil, start_time)
        halted_conn

      %Plug.Conn{} = halted_conn ->
        halted_conn
    end
  end

  defp dispatch_request(conn, request, _method) do
    observe_rpc(conn, request["method"], "method_not_found")
    jsonrpc_http_error(conn, 200, -32601, "Method not found", request["id"])
  end

  defp ensure_method_scope(_conn, "tools/call"), do: :ok

  defp ensure_method_scope(conn, _method) do
    ensure_scopes(conn, ["mcp:read"])
  end

  defp ensure_scopes(conn, required_scopes) do
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

  defp optional_arguments(map, key) do
    case Map.get(map, key) do
      nil -> {:ok, %{}}
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

  defp fetch_tool_call_params(request) do
    with {:ok, params} <- fetch_map(request, "params"),
         {:ok, name} <- fetch_required(params, "name"),
         {:ok, arguments} <- optional_arguments(params, "arguments") do
      {:ok, name, arguments}
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

  defp observe_rpc(conn, method, outcome) do
    Observability.rpc_request(Map.merge(grant_context(conn), %{method: method, outcome: outcome}))
  end

  defp observe_method_scope_denied(_conn, "tools/call"), do: :ok

  defp observe_method_scope_denied(conn, method) do
    observe_rpc(conn, method || "unknown", "insufficient_scope")
  end

  defp observe_tools_call(conn, tool, outcome, definition, start_time) do
    duration_ms = System.convert_time_unit(System.monotonic_time() - start_time, :native, :millisecond)

    attrs =
      grant_context(conn)
      |> Map.merge(%{tool: tool, outcome: outcome, duration_ms: duration_ms})
      |> maybe_put_safety_classification(definition)

    Observability.tools_call(attrs)
  end

  defp maybe_put_safety_classification(attrs, nil), do: attrs

  defp maybe_put_safety_classification(attrs, definition) do
    Map.put(attrs, :safety_classification, definition.safety_classification)
  end

  defp grant_context(conn) do
    case conn.assigns[:current_mcp_grant] do
      %{id: grant_id, client_id: client_id, company_id: company_id} ->
        %{grant_id: grant_id, client_id: client_id, company_id: company_id}

      _ ->
        %{}
    end
  end

  defp tool_name_from_request(%{"params" => %{"name" => name}}) when is_binary(name), do: name
  defp tool_name_from_request(_), do: "unknown"
end
