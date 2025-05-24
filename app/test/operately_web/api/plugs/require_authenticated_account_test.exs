defmodule OperatelyWeb.Api.Plugs.RequireAuthenticatedAccountTest do
  use ExUnit.Case
  use Plug.Test

  test "it returns 401 if the current account is nil" do
    conn = conn(:get, "/")
    conn = assign(conn, :current_account, nil)
    conn = assign(conn, :turbo_req_name, "get_user")
    conn = assign(conn, :turbo_req_type, "query")
    conn = OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount.call(conn, nil)

    assert conn.status == 401
    assert conn.resp_body == "Unauthorized"
  end

  test "it returns the connection if the current account is not nil" do
    conn = conn(:get, "/")
    conn = assign(conn, :current_account, %Operately.People.Account{})
    conn = assign(conn, :turbo_req_name, "get_user")
    conn = assign(conn, :turbo_req_type, "query")
    conn = OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount.call(conn, nil)

    assert conn.status == nil
    assert conn.resp_body == nil
  end

  describe "except option" do
    test "it skips authentication if the tuple is in the except list" do
      conn = conn(:get, "/")
      conn = assign(conn, :current_account, nil)
      conn = assign(conn, :turbo_req_name, "get_user")
      conn = assign(conn, :turbo_req_type, "query")

      conn = OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount.call(conn, except: [{"query", "get_user"}])
      assert conn.status == nil
      assert conn.resp_body == nil

      conn = OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount.call(conn, nil)
      assert conn.status == 401
      assert conn.resp_body == "Unauthorized"
    end
  end
end
