defmodule Operately.Mcp.ObservabilityTest do
  use ExUnit.Case, async: true

  alias Operately.Mcp.Observability

  setup do
    handler_id = "mcp-observability-test-#{System.unique_integer([:positive])}"
    test_pid = self()

    :ok =
      :telemetry.attach_many(
        handler_id,
        [
          [:operately, :mcp, :rpc, :stop],
          [:operately, :mcp, :tools_call, :stop],
          [:operately, :mcp, :oauth, :stop],
          [:operately, :mcp, :cimd, :fetch, :stop]
        ],
        fn event, measurements, metadata, pid ->
          send(pid, {:telemetry_event, event, measurements, metadata})
        end,
        test_pid
      )

    on_exit(fn -> :telemetry.detach(handler_id) end)

    :ok
  end

  test "rpc_request emits telemetry with method and outcome" do
    Observability.rpc_request(%{
      method: "ping",
      outcome: "ok",
      grant_id: "grant-1",
      client_id: "chatgpt",
      company_id: "company-1"
    })

    assert_receive {:telemetry_event, [:operately, :mcp, :rpc, :stop], %{count: 1}, metadata}
    assert metadata[:method] == "ping"
    assert metadata[:outcome] == "ok"
    assert metadata[:grant_id] == "grant-1"
  end

  test "tools_call emits telemetry with tool and safety classification" do
    Observability.tools_call(%{
      tool: "get_project",
      outcome: "ok",
      safety_classification: :read_only,
      grant_id: "grant-1",
      client_id: "chatgpt",
      company_id: "company-1",
      duration_ms: 12
    })

    assert_receive {:telemetry_event, [:operately, :mcp, :tools_call, :stop], %{count: 1}, metadata}
    assert metadata[:tool] == "get_project"
    assert metadata[:outcome] == "ok"
    assert metadata[:safety_classification] == "read_only"
    assert metadata[:duration_ms] == 12
  end

  test "oauth_authorize emits telemetry for failures" do
    Observability.oauth_authorize(%{result: :invalid_client, client_id: "https://client.example.com/oauth/client.json"})

    assert_receive {:telemetry_event, [:operately, :mcp, :oauth, :stop], %{count: 1}, metadata}
    assert metadata[:action] == "authorize"
    assert metadata[:result] == "invalid_client"
  end

  test "oauth_token emits telemetry for failures" do
    Observability.oauth_token(%{
      result: :invalid_grant,
      client_id: "chatgpt",
      grant_type: "authorization_code"
    })

    assert_receive {:telemetry_event, [:operately, :mcp, :oauth, :stop], %{count: 1}, metadata}
    assert metadata[:action] == "token"
    assert metadata[:result] == "invalid_grant"
    assert metadata[:grant_type] == "authorization_code"
  end

  test "cimd_fetch emits telemetry with cache tag" do
    Observability.cimd_fetch(%{
      client_id: "https://client.example.com/oauth/client.json",
      result: "ok",
      cache: "hit"
    })

    assert_receive {:telemetry_event, [:operately, :mcp, :cimd, :fetch, :stop], %{count: 1}, metadata}
    assert metadata[:result] == "ok"
    assert metadata[:cache] == "hit"
  end

  test "tools_call_outcome classifies tool errors" do
    assert Observability.tools_call_outcome(%{"structuredContent" => %{}}) == "ok"
    assert Observability.tools_call_outcome(%{"isError" => true, "content" => []}) == "tool_error"
  end

  test "cimd_result maps unsafe_url to ssrf_blocked" do
    assert Observability.cimd_result(:unsafe_url) == "ssrf_blocked"
    assert Observability.cimd_result(:fetch_failed) == "fetch_failed"
  end
end
