defmodule OperatelyWeb.Api.Plugs.RequireAuthenticatedAccountTest do
  use ExUnit.Case
  use Plug.Test

  test "it returns 401 if the current account is nil" do
    conn = conn(:get, "/")
    conn = assign(conn, :current_account, nil)
    conn = OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount.call(conn, nil)

    assert conn.status == 401
    assert conn.resp_body == "Unauthorized"
  end

  test "it returns the connection if the current account is not nil" do
    conn = conn(:get, "/")
    conn = assign(conn, :current_account, %Operately.People.Account{})
    conn = OperatelyWeb.Api.Plugs.RequireAuthenticatedAccount.call(conn, nil)

    assert conn.status == nil
    assert conn.resp_body == nil
  end
end
