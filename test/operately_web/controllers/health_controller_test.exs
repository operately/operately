defmodule OperatelyWeb.HealthControllerTest do
  use OperatelyWeb.ConnCase

  test "GET /health", %{conn: conn} do
    conn = get(conn, ~p"/health")
    assert text_response(conn, 200)
    assert conn.resp_body == "HEALTHY"
  end
end
