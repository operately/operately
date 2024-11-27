defmodule OperatelyWeb.AccountSessionControllerTest do
  use OperatelyWeb.ConnCase, async: true

  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures

  setup do
    company_fixture()
    %{account: account_fixture()}
  end

  describe "GET /accounts/log_in" do
    test "returns 200 if the account is already logged in", %{conn: conn, account: account} do
      conn = conn |> log_in_account(account) |> get("/accounts/log_in")
      assert html_response(conn, 200)
    end
  end

  describe "DELETE /accounts/log_out" do
    test "logs the account out", %{conn: conn, account: account} do
      conn = conn |> log_in_account(account) |> delete("/accounts/log_out")
      refute get_session(conn, :account_token)
      assert conn.status == 200
    end

    test "succeeds even if the account is not logged in", %{conn: conn} do
      conn = delete(conn, "/accounts/log_out")
      refute get_session(conn, :account_token)
      assert conn.status == 200
    end
  end
end
