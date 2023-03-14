defmodule OperatelyWeb.AccountSettingsControllerTest do
  use OperatelyWeb.ConnCase, async: true

  alias Operately.People
  import Operately.PeopleFixtures

  setup :register_and_log_in_account

  describe "GET /accounts/settings" do
    test "renders settings page", %{conn: conn} do
      conn = get(conn, ~p"/accounts/settings")
      response = html_response(conn, 200)
      assert response =~ "Settings"
    end

    test "redirects if account is not logged in" do
      conn = build_conn()
      conn = get(conn, ~p"/accounts/settings")
      assert redirected_to(conn) == ~p"/accounts/log_in"
    end
  end

  describe "PUT /accounts/settings (change password form)" do
    test "updates the account password and resets tokens", %{conn: conn, account: account} do
      new_password_conn =
        put(conn, ~p"/accounts/settings", %{
          "action" => "update_password",
          "current_password" => valid_account_password(),
          "account" => %{
            "password" => "new valid password",
            "password_confirmation" => "new valid password"
          }
        })

      assert redirected_to(new_password_conn) == ~p"/accounts/settings"

      assert get_session(new_password_conn, :account_token) != get_session(conn, :account_token)

      assert Phoenix.Flash.get(new_password_conn.assigns.flash, :info) =~
               "Password updated successfully"

      assert People.get_account_by_email_and_password(account.email, "new valid password")
    end

    test "does not update password on invalid data", %{conn: conn} do
      old_password_conn =
        put(conn, ~p"/accounts/settings", %{
          "action" => "update_password",
          "current_password" => "invalid",
          "account" => %{
            "password" => "too short",
            "password_confirmation" => "does not match"
          }
        })

      response = html_response(old_password_conn, 200)
      assert response =~ "Settings"
      assert response =~ "should be at least 12 character(s)"
      assert response =~ "does not match password"
      assert response =~ "is not valid"

      assert get_session(old_password_conn, :account_token) == get_session(conn, :account_token)
    end
  end

  describe "PUT /accounts/settings (change email form)" do
    @tag :capture_log
    test "updates the account email", %{conn: conn, account: account} do
      conn =
        put(conn, ~p"/accounts/settings", %{
          "action" => "update_email",
          "current_password" => valid_account_password(),
          "account" => %{"email" => unique_account_email()}
        })

      assert redirected_to(conn) == ~p"/accounts/settings"

      assert Phoenix.Flash.get(conn.assigns.flash, :info) =~
               "A link to confirm your email"

      assert People.get_account_by_email(account.email)
    end

    test "does not update email on invalid data", %{conn: conn} do
      conn =
        put(conn, ~p"/accounts/settings", %{
          "action" => "update_email",
          "current_password" => "invalid",
          "account" => %{"email" => "with spaces"}
        })

      response = html_response(conn, 200)
      assert response =~ "Settings"
      assert response =~ "must have the @ sign and no spaces"
      assert response =~ "is not valid"
    end
  end

  describe "GET /accounts/settings/confirm_email/:token" do
    setup %{account: account} do
      email = unique_account_email()

      token =
        extract_account_token(fn url ->
          People.deliver_account_update_email_instructions(%{account | email: email}, account.email, url)
        end)

      %{token: token, email: email}
    end

    test "updates the account email once", %{conn: conn, account: account, token: token, email: email} do
      conn = get(conn, ~p"/accounts/settings/confirm_email/#{token}")
      assert redirected_to(conn) == ~p"/accounts/settings"

      assert Phoenix.Flash.get(conn.assigns.flash, :info) =~
               "Email changed successfully"

      refute People.get_account_by_email(account.email)
      assert People.get_account_by_email(email)

      conn = get(conn, ~p"/accounts/settings/confirm_email/#{token}")

      assert redirected_to(conn) == ~p"/accounts/settings"

      assert Phoenix.Flash.get(conn.assigns.flash, :error) =~
               "Email change link is invalid or it has expired"
    end

    test "does not update email with invalid token", %{conn: conn, account: account} do
      conn = get(conn, ~p"/accounts/settings/confirm_email/oops")
      assert redirected_to(conn) == ~p"/accounts/settings"

      assert Phoenix.Flash.get(conn.assigns.flash, :error) =~
               "Email change link is invalid or it has expired"

      assert People.get_account_by_email(account.email)
    end

    test "redirects if account is not logged in", %{token: token} do
      conn = build_conn()
      conn = get(conn, ~p"/accounts/settings/confirm_email/#{token}")
      assert redirected_to(conn) == ~p"/accounts/log_in"
    end
  end
end
