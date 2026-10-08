defmodule OperatelyWeb.AnalyticsTest do
  use ExUnit.Case, async: true
  import Plug.Conn
  alias OperatelyWeb.Analytics

  test "API and MCP provenance comes from authentication and ignores browser cookies" do
    conn = Plug.Test.conn(:post, "/") |> put_req_header("cookie", "operately_analytics_v1=" <> URI.encode(Jason.encode!(%{version: 1, preference: "granted"})))
    assert Analytics.context(assign(conn, :api_auth_mode, :mcp_oauth)).channel == "mcp"
    result = Analytics.context(assign(conn, :api_auth_mode, :api_token))
    assert result.channel == "api"
    assert result.preference == "unspecified"
    assert result.attribution == %{}
  end

  test "a stored opt-in never clears a later account opt-out implicitly" do
    conn = Plug.Test.conn(:post, "/") |> put_req_header("cookie", "operately_analytics_v1=" <> URI.encode(Jason.encode!(%{version: 1, preference: "granted"})))
    assert Analytics.context(conn).preference == "unspecified"
    assert Analytics.context(put_req_header(conn, "sec-gpc", "1")).preference == "denied"
  end

  test "malformed optional cookie does not block authentication" do
    conn = Plug.Test.conn(:post, "/") |> put_req_header("cookie", "operately_analytics_v1=%XXbad")
    assert Analytics.context(conn).attribution == %{}
  end
end
