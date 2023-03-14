defmodule OperatelyWeb.AccountResetPasswordControllerTest do
  use OperatelyWeb.ConnCase, async: true

  alias Operately.People
  alias Operately.Repo
  import Operately.PeopleFixtures

  setup do
    %{account: account_fixture()}
  end

  describe "GET /accounts/reset_password" do
    test "renders the reset password page", %{conn: conn} do
      conn = get(conn, ~p"/accounts/reset_password")
      response = html_response(conn, 200)
      assert response =~ "Forgot your password?"
    end
  end

  describe "POST /accounts/reset_password" do
    @tag :capture_log
    test "sends a new reset password token", %{conn: conn, account: account} do
      conn =
        post(conn, ~p"/accounts/reset_password", %{
          "account" => %{"email" => account.email}
        })

      assert redirected_to(conn) == ~p"/"

      assert Phoenix.Flash.get(conn.assigns.flash, :info) =~
               "If your email is in our system"

      assert Repo.get_by!(People.AccountToken, account_id: account.id).context == "reset_password"
    end

    test "does not send reset password token if email is invalid", %{conn: conn} do
      conn =
        post(conn, ~p"/accounts/reset_password", %{
          "account" => %{"email" => "unknown@example.com"}
        })

      assert redirected_to(conn) == ~p"/"

      assert Phoenix.Flash.get(conn.assigns.flash, :info) =~
               "If your email is in our system"

      assert Repo.all(People.AccountToken) == []
    end
  end

  describe "GET /accounts/reset_password/:token" do
    setup %{account: account} do
      token =
        extract_account_token(fn url ->
          People.deliver_account_reset_password_instructions(account, url)
        end)

      %{token: token}
    end

    test "renders reset password", %{conn: conn, token: token} do
      conn = get(conn, ~p"/accounts/reset_password/#{token}")
      assert html_response(conn, 200) =~ "Reset password"
    end

    test "does not render reset password with invalid token", %{conn: conn} do
      conn = get(conn, ~p"/accounts/reset_password/oops")
      assert redirected_to(conn) == ~p"/"

      assert Phoenix.Flash.get(conn.assigns.flash, :error) =~
               "Reset password link is invalid or it has expired"
    end
  end

  describe "PUT /accounts/reset_password/:token" do
    setup %{account: account} do
      token =
        extract_account_token(fn url ->
          People.deliver_account_reset_password_instructions(account, url)
        end)

      %{token: token}
    end

    test "resets password once", %{conn: conn, account: account, token: token} do
      conn =
        put(conn, ~p"/accounts/reset_password/#{token}", %{
          "account" => %{
            "password" => "new valid password",
            "password_confirmation" => "new valid password"
          }
        })

      assert redirected_to(conn) == ~p"/accounts/log_in"
      refute get_session(conn, :account_token)

      assert Phoenix.Flash.get(conn.assigns.flash, :info) =~
               "Password reset successfully"

      assert People.get_account_by_email_and_password(account.email, "new valid password")
    end

    test "does not reset password on invalid data", %{conn: conn, token: token} do
      conn =
        put(conn, ~p"/accounts/reset_password/#{token}", %{
          "account" => %{
            "password" => "too short",
            "password_confirmation" => "does not match"
          }
        })

      assert html_response(conn, 200) =~ "something went wrong"
    end

    test "does not reset password with invalid token", %{conn: conn} do
      conn = put(conn, ~p"/accounts/reset_password/oops")
      assert redirected_to(conn) == ~p"/"

      assert Phoenix.Flash.get(conn.assigns.flash, :error) =~
               "Reset password link is invalid or it has expired"
    end
  end
end
