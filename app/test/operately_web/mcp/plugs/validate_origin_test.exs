defmodule OperatelyWeb.Mcp.Plugs.ValidateOriginTest do
  use ExUnit.Case, async: true

  import Plug.Conn
  import Plug.Test

  alias OperatelyWeb.Mcp.Plugs.ValidateOrigin

  test "allows requests without an origin header" do
    conn =
      conn(:post, "/mcp")
      |> ValidateOrigin.call([])

    refute conn.halted
    assert conn.status != 403
  end

  test "allows localhost origins when strict validation is enabled" do
    previous = Application.get_env(:operately, :mcp_strict_origin_validation)
    Application.put_env(:operately, :mcp_strict_origin_validation, true)

    on_exit(fn ->
      Application.put_env(:operately, :mcp_strict_origin_validation, previous)
    end)

    conn =
      conn(:post, "/mcp")
      |> put_req_header("origin", "http://localhost:4567")
      |> ValidateOrigin.call([])

    refute conn.halted
    assert conn.status != 403
  end

  test "rejects unknown origins when strict validation is enabled" do
    previous = Application.get_env(:operately, :mcp_strict_origin_validation)
    Application.put_env(:operately, :mcp_strict_origin_validation, true)

    on_exit(fn ->
      Application.put_env(:operately, :mcp_strict_origin_validation, previous)
    end)

    conn =
      conn(:post, "/mcp")
      |> put_req_header("origin", "https://evil.example.com")
      |> ValidateOrigin.call([])

    assert conn.halted
    assert conn.status == 403
  end

  test "allows remote MCP client origins when strict validation is disabled" do
    previous = Application.get_env(:operately, :mcp_strict_origin_validation)
    Application.put_env(:operately, :mcp_strict_origin_validation, false)

    on_exit(fn ->
      Application.put_env(:operately, :mcp_strict_origin_validation, previous)
    end)

    for origin <- ["https://chatgpt.com", "https://chat.openai.com", "https://claude.ai"] do
      conn =
        conn(:post, "/mcp")
        |> put_req_header("origin", origin)
        |> ValidateOrigin.call([])

      refute conn.halted, "expected #{origin} to be allowed"
      assert conn.status != 403
    end
  end
end
