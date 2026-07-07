defmodule Operately.Mcp.Observability do
  @moduledoc false

  require Logger

  @rpc_event [:operately, :mcp, :rpc, :stop]
  @tools_call_event [:operately, :mcp, :tools_call, :stop]
  @oauth_event [:operately, :mcp, :oauth, :stop]
  @cimd_fetch_event [:operately, :mcp, :cimd, :fetch, :stop]

  @doc """
  Records an MCP JSON-RPC request (all methods except tools/call detail).
  """
  def rpc_request(attrs) when is_map(attrs) do
    metadata = build_rpc_metadata(attrs)

    :telemetry.execute(@rpc_event, %{count: 1}, telemetry_metadata(metadata))
    log_rpc(metadata)
  end

  @doc """
  Records a tools/call request with tool name and outcome.
  """
  def tools_call(attrs) when is_map(attrs) do
    metadata = build_tools_call_metadata(attrs)

    :telemetry.execute(@tools_call_event, %{count: 1}, telemetry_metadata(metadata))
    log_tools_call(metadata)
  end

  @doc """
  Records an OAuth authorization failure.
  """
  def oauth_authorize(attrs) when is_map(attrs) do
    metadata =
      attrs
      |> Map.put(:action, "authorize")
      |> normalize_oauth_metadata()

    :telemetry.execute(@oauth_event, %{count: 1}, telemetry_metadata(metadata))
    log_oauth(metadata)
  end

  @doc """
  Records an OAuth token endpoint failure.
  """
  def oauth_token(attrs) when is_map(attrs) do
    metadata =
      attrs
      |> Map.put(:action, "token")
      |> normalize_oauth_metadata()

    :telemetry.execute(@oauth_event, %{count: 1}, telemetry_metadata(metadata))
    log_oauth(metadata)
  end

  @doc """
  Records a dynamic client registration attempt.
  """
  def oauth_register(attrs) when is_map(attrs) do
    metadata =
      attrs
      |> Map.put(:action, "register")
      |> normalize_oauth_metadata()

    :telemetry.execute(@oauth_event, %{count: 1}, telemetry_metadata(metadata))
    log_oauth(metadata)
  end

  @doc """
  Records a CIMD metadata fetch attempt.
  """
  def cimd_fetch(attrs) when is_map(attrs) do
    metadata = normalize_cimd_metadata(attrs)

    :telemetry.execute(@cimd_fetch_event, %{count: 1}, telemetry_metadata(metadata))
    log_cimd_fetch(metadata)
  end

  @doc """
  Classifies a tools/call result map into an observability outcome.
  """
  def tools_call_outcome(result) when is_map(result) do
    if Map.get(result, "isError") == true, do: "tool_error", else: "ok"
  end

  def tools_call_outcome(_), do: "internal_error"

  @doc """
  Maps CIMD fetch error atoms to observability result strings.
  """
  def cimd_result(:ok), do: "ok"
  def cimd_result(:unsafe_url), do: "ssrf_blocked"
  def cimd_result(:fetch_failed), do: "fetch_failed"
  def cimd_result(:invalid_response), do: "invalid_response"
  def cimd_result(result) when is_atom(result), do: Atom.to_string(result)
  def cimd_result(result) when is_binary(result), do: result
  def cimd_result(_), do: "unknown"

  defp build_rpc_metadata(attrs) do
    attrs
    |> Map.take([:method, :outcome, :grant_id, :client_id, :company_id, :duration_ms])
    |> Map.put(:method, normalize_string(Map.get(attrs, :method), "unknown"))
    |> Map.put(:outcome, normalize_string(Map.get(attrs, :outcome), "unknown"))
    |> reject_nil_values()
  end

  defp build_tools_call_metadata(attrs) do
    attrs
    |> Map.take([:tool, :outcome, :safety_classification, :grant_id, :client_id, :company_id, :duration_ms])
    |> Map.put(:tool, normalize_string(Map.get(attrs, :tool), "unknown"))
    |> Map.put(:outcome, normalize_string(Map.get(attrs, :outcome), "unknown"))
    |> Map.put(:safety_classification, normalize_safety_classification(Map.get(attrs, :safety_classification)))
    |> reject_nil_values()
  end

  defp normalize_oauth_metadata(attrs) do
    attrs
    |> Map.take([:action, :result, :client_id, :grant_type])
    |> Map.put(:action, normalize_string(Map.get(attrs, :action), "unknown"))
    |> Map.put(:result, normalize_string(Map.get(attrs, :result), "unknown"))
    |> Map.put(:grant_type, normalize_grant_type(Map.get(attrs, :grant_type)))
    |> reject_nil_values()
  end

  defp normalize_cimd_metadata(attrs) do
    attrs
    |> Map.take([:client_id, :result, :cache])
    |> Map.put(:result, normalize_string(Map.get(attrs, :result), "unknown"))
    |> Map.put(:cache, normalize_string(Map.get(attrs, :cache), "miss"))
    |> reject_nil_values()
  end

  defp normalize_safety_classification(nil), do: "unknown"
  defp normalize_safety_classification(value) when is_atom(value), do: Atom.to_string(value)
  defp normalize_safety_classification(value) when is_binary(value), do: value
  defp normalize_safety_classification(_), do: "unknown"

  defp normalize_grant_type(nil), do: nil
  defp normalize_grant_type(value) when is_binary(value) and value != "", do: value
  defp normalize_grant_type(_), do: "unknown"

  defp normalize_string(nil, default), do: default
  defp normalize_string(value, _default) when is_atom(value), do: Atom.to_string(value)
  defp normalize_string(value, _default) when is_binary(value) and value != "", do: value
  defp normalize_string(_, default), do: default

  defp telemetry_metadata(metadata) do
    reject_nil_values(metadata)
  end

  defp reject_nil_values(metadata) do
    metadata
    |> Enum.reject(fn {_key, value} -> is_nil(value) end)
    |> Map.new()
  end

  defp log_rpc(metadata) do
    if metadata[:outcome] in ["internal_error", "protocol_error"] do
      Logger.error("MCP request: #{inspect(metadata)}")
    else
      Logger.info("MCP request: #{inspect(metadata)}")
    end
  end

  defp log_tools_call(metadata) do
    if metadata[:outcome] in ["internal_error", "tool_error"] do
      Logger.warning("MCP tools/call: #{inspect(metadata)}")
    else
      Logger.info("MCP tools/call: #{inspect(metadata)}")
    end
  end

  defp log_oauth(metadata) do
    Logger.warning("MCP OAuth: #{inspect(metadata)}")
  end

  defp log_cimd_fetch(%{result: "ok"} = metadata) do
    Logger.info("MCP CIMD fetch: #{inspect(metadata)}")
  end

  defp log_cimd_fetch(metadata) do
    Logger.warning("MCP CIMD fetch: #{inspect(metadata)}")
  end
end
