defmodule OperatelyWeb.PageControllerTest do
  use OperatelyWeb.ConnCase

  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures

  test "GET / renders configured false when there are no companies and no accounts", %{conn: conn} do
    conn = get(conn, "/")

    assert html_response(conn, 200)
    assert conn.resp_body =~ ~s("configured":false)
  end

  test "GET / renders configured true when there are accounts but no companies", %{conn: conn} do
    account_fixture()

    conn = get(conn, "/")

    assert html_response(conn, 200)
    assert conn.resp_body =~ ~s("configured":true)
  end

  test "GET / renders configured true when there is at least one company", %{conn: conn} do
    company_fixture()

    conn = get(conn, "/")

    assert html_response(conn, 200)
    assert conn.resp_body =~ ~s("configured":true)
  end
end
