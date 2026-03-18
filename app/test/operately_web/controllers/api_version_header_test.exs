defmodule OperatelyWeb.ApiVersionHeaderTest do
  use OperatelyWeb.ConnCase, async: true

  test "GET /api/v2/missing includes the current version header", %{conn: conn} do
    conn =
      conn
      |> put_req_header("accept", "application/json")
      |> get("/api/v2/missing")

    assert response(conn, 404)
    assert [version] = get_resp_header(conn, "x-operately-version")
    assert is_binary(version)
    assert version != ""
  end
end
