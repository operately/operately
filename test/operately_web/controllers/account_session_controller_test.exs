defmodule OperatelyWeb.AccountSessionControllerTest do
  use OperatelyWeb.ConnCase, async: true

  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures

  setup do
    company_fixture()
    %{account: account_fixture()}
  end

  describe "GET /accounts/log_in" do
    test "renders log in page", %{conn: conn} do
      Application.put_env(:operately, :allow_login_with_google, "yes")

      conn = get(conn, ~p"/accounts/log_in")
      response = html_response(conn, 200)
      assert response =~ "Sign in with Google"
    end

    test "redirects if already logged in", %{conn: conn, account: account} do
      conn = conn |> log_in_account(account) |> get(~p"/accounts/log_in")
      assert redirected_to(conn) == ~p"/"
    end
  end

  describe "DELETE /accounts/log_out" do
    test "logs the account out", %{conn: conn, account: account} do
      conn = conn |> log_in_account(account) |> delete(~p"/accounts/log_out")
      assert redirected_to(conn) == ~p"/"
      refute get_session(conn, :account_token)
      assert Phoenix.Flash.get(conn.assigns.flash, :info) =~ "Logged out successfully"
    end

    test "succeeds even if the account is not logged in", %{conn: conn} do
      conn = delete(conn, ~p"/accounts/log_out")
      assert redirected_to(conn) == ~p"/"
      refute get_session(conn, :account_token)
      assert Phoenix.Flash.get(conn.assigns.flash, :info) =~ "Logged out successfully"
    end
  end
end
