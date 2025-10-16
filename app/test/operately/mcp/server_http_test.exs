defmodule Operately.MCP.ServerHTTPTest do
  use OperatelyWeb.ConnCase

  alias Operately.Support.Factory

  @accept_header "application/json, text/event-stream"
  @protocol_version "2025-03-26"

  setup %{conn: conn} do
    ctx = Factory.setup(%{})
    conn = OperatelyWeb.ConnCase.log_in_account(conn, ctx.account, ctx.company)

    ctx =
      ctx
      |> Factory.add_space(:marketing)
      |> Factory.add_goal(:integration_goal, :marketing, name: "MCP Integration Goal")
      |> Factory.add_project(:integration_project, :marketing, name: "MCP Integration Project")

    company_id = OperatelyWeb.Paths.company_id(ctx.company)

    {:ok, conn: conn, company_id: company_id}
  end

  test "search and fetch tools respond over HTTP transport", %{conn: conn, company_id: company_id} do
    {conn, session_id, init_response} = initialize_session(conn, company_id)

    assert get_in(init_response, ["result", "serverInfo", "name"]) == "Operately MCP Server"
    assert get_in(init_response, ["result", "capabilities"])["tools"]

    conn = recycle(conn)
    conn = notifications_initialized(conn, company_id, session_id)
    assert response(conn, 202) == "{}"

    conn = recycle(conn)
    conn = call_tool(conn, company_id, session_id, "search", %{"query" => "Integration"})
    search_response = json_response(conn, 200)
    search_payload = decode_payload(search_response)

    results = Map.fetch!(search_payload, "results")
    goal_entry = Enum.find(results, &match?(%{"metadata" => %{"type" => "goal"}}, &1))
    project_entry = Enum.find(results, &match?(%{"metadata" => %{"type" => "project"}}, &1))

    assert goal_entry["title"] == "MCP Integration Goal"
    assert String.starts_with?(goal_entry["id"], "operately://goals/")
    assert project_entry["title"] == "MCP Integration Project"
    assert String.starts_with?(project_entry["id"], "operately://projects/")

    conn = recycle(conn)
    conn = call_tool(conn, company_id, session_id, "fetch", %{"id" => goal_entry["id"]})
    goal_fetch = json_response(conn, 200)
    goal_payload = decode_payload(goal_fetch)

    assert goal_payload["title"] == "MCP Integration Goal"
    assert String.contains?(goal_payload["text"], "MCP Integration Goal")

    conn = recycle(conn)
    conn = call_tool(conn, company_id, session_id, "fetch", %{"id" => project_entry["id"]})
    project_fetch = json_response(conn, 200)
    project_payload = decode_payload(project_fetch)

    assert project_payload["title"] == "MCP Integration Project"
    assert String.contains?(project_payload["text"], "MCP Integration Project")
  end

  defp initialize_session(conn, company_id) do
    initialize_body =
      %{
        "jsonrpc" => "2.0",
        "id" => "init-1",
        "method" => "initialize",
        "params" => %{
          "clientInfo" => %{"name" => "integration-test", "version" => "0.1.0"},
          "capabilities" => %{},
          "protocolVersion" => @protocol_version
        }
      }
      |> Jason.encode!()

    conn = post_mcp(conn, company_id, initialize_body)
    response = json_response(conn, 200)
    session_id = conn |> get_resp_header("mcp-session-id") |> List.first()

    {conn, session_id, response}
  end

  defp notifications_initialized(conn, company_id, session_id) do
    notification =
      %{
        "jsonrpc" => "2.0",
        "method" => "notifications/initialized",
        "params" => %{}
      }
      |> Jason.encode!()

    post_mcp(conn, company_id, notification, [{"mcp-session-id", session_id}])
  end

  defp call_tool(conn, company_id, session_id, name, arguments) do
    request =
      %{
        "jsonrpc" => "2.0",
        "id" => "call-#{System.unique_integer([:positive])}",
        "method" => "tools/call",
        "params" => %{
          "name" => name,
          "arguments" => arguments
        }
      }
      |> Jason.encode!()

    post_mcp(conn, company_id, request, [{"mcp-session-id", session_id}])
  end

  defp post_mcp(conn, company_id, body, extra_headers \\ []) do
    conn
    |> put_req_header("accept", @accept_header)
    |> put_req_header("content-type", "application/json")
    |> then(fn conn ->
      Enum.reduce(extra_headers, conn, fn {key, value}, acc -> put_req_header(acc, key, value) end)
    end)
    |> post("/#{company_id}/mcp", body)
  end

  defp decode_payload(%{"result" => %{"content" => [%{"text" => text} | _]}}) do
    Jason.decode!(text)
  end
end
