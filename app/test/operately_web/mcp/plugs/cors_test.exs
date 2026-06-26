defmodule OperatelyWeb.Mcp.Plugs.CorsTest do
  use ExUnit.Case, async: true

  import Plug.Conn
  import Plug.Test

  alias OperatelyWeb.Mcp.Plugs.Cors

  test "responds to discovery OPTIONS preflight with CORS headers" do
    conn =
      conn(:options, "/.well-known/oauth-authorization-server/mcp")
      |> put_req_header("origin", "https://chatgpt.com")
      |> put_req_header("access-control-request-method", "GET")
      |> Cors.call([])

    assert conn.halted
    assert conn.status == 204
    assert {"access-control-allow-origin", "https://chatgpt.com"} in conn.resp_headers
    assert {"access-control-allow-methods", "GET, OPTIONS"} in conn.resp_headers
    assert {"access-control-allow-headers", "authorization, content-type, accept, mcp-session-id, mcp-protocol-version, origin"} in conn.resp_headers
    assert {"access-control-max-age", "86400"} in conn.resp_headers
  end

  test "responds to mcp OPTIONS preflight with transport methods" do
    conn =
      conn(:options, "/mcp")
      |> put_req_header("origin", "https://claude.ai")
      |> put_req_header("access-control-request-method", "POST")
      |> Cors.call([])

    assert conn.halted
    assert conn.status == 204
    assert {"access-control-allow-origin", "https://claude.ai"} in conn.resp_headers
    assert {"access-control-allow-methods", "GET, POST, DELETE, OPTIONS"} in conn.resp_headers
  end

  test "adds allow-origin to discovery GET responses" do
    conn =
      conn(:get, "/.well-known/oauth-authorization-server")
      |> put_req_header("origin", "https://chatgpt.com")
      |> Cors.call([])
      |> send_resp(200, "{}")

    assert get_resp_header(conn, "access-control-allow-origin") == ["https://chatgpt.com"]
  end

  test "ignores unrelated paths" do
    conn =
      conn(:options, "/oauth/authorize")
      |> put_req_header("origin", "https://chatgpt.com")
      |> Cors.call([])

    refute conn.halted
    refute conn.status == 204
  end
end
