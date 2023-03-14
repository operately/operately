defmodule OperatelyWeb.AccountSessionControllerTest do
  use OperatelyWeb.ConnCase, async: true

  import Operately.PeopleFixtures

  setup do
    %{account: account_fixture()}
  end

  describe "GET /accounts/log_in" do
    test "renders log in page", %{conn: conn} do
      conn = get(conn, ~p"/accounts/log_in")
      response = html_response(conn, 200)
      assert response =~ "Log in"
      assert response =~ ~p"/users/register"
      assert response =~ "Forgot your password?"
    end

    test "redirects if already logged in", %{conn: conn, account: account} do
      conn = conn |> log_in_account(account) |> get(~p"/accounts/log_in")
      assert redirected_to(conn) == ~p"/"
    end
  end

  describe "POST /accounts/log_in" do
    test "logs the account in", %{conn: conn, account: account} do
      conn =
        post(conn, ~p"/accounts/log_in", %{
          "account" => %{"email" => account.email, "password" => valid_account_password()}
        })

      assert get_session(conn, :account_token)
      assert redirected_to(conn) == ~p"/"

      # Now do a logged in request and assert on the menu
      conn = get(conn, ~p"/")
      response = html_response(conn, 200)
      assert response =~ account.email
      assert response =~ ~p"/users/settings"
      assert response =~ ~p"/users/log_out"
    end

    test "logs the account in with remember me", %{conn: conn, account: account} do
      conn =
        post(conn, ~p"/accounts/log_in", %{
          "account" => %{
            "email" => account.email,
            "password" => valid_account_password(),
            "remember_me" => "true"
          }
        })

      assert conn.resp_cookies["_operately_web_account_remember_me"]
      assert redirected_to(conn) == ~p"/"
    end

    test "logs the account in with return to", %{conn: conn, account: account} do
      conn =
        conn
        |> init_test_session(account_return_to: "/foo/bar")
        |> post(~p"/accounts/log_in", %{
          "account" => %{
            "email" => account.email,
            "password" => valid_account_password()
          }
        })

      assert redirected_to(conn) == "/foo/bar"
      assert Phoenix.Flash.get(conn.assigns.flash, :info) =~ "Welcome back!"
    end

    test "emits error message with invalid credentials", %{conn: conn, account: account} do
      conn =
        post(conn, ~p"/accounts/log_in", %{
          "account" => %{"email" => account.email, "password" => "invalid_password"}
        })

      response = html_response(conn, 200)
      assert response =~ "Log in"
      assert response =~ "Invalid email or password"
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
