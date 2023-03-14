defmodule OperatelyWeb.AccountAuthTest do
  use OperatelyWeb.ConnCase, async: true

  alias Phoenix.LiveView
  alias Operately.People
  alias OperatelyWeb.AccountAuth
  import Operately.PeopleFixtures

  @remember_me_cookie "_operately_web_account_remember_me"

  setup %{conn: conn} do
    conn =
      conn
      |> Map.replace!(:secret_key_base, OperatelyWeb.Endpoint.config(:secret_key_base))
      |> init_test_session(%{})

    %{account: account_fixture(), conn: conn}
  end

  describe "log_in_account/3" do
    test "stores the account token in the session", %{conn: conn, account: account} do
      conn = AccountAuth.log_in_account(conn, account)
      assert token = get_session(conn, :account_token)
      assert get_session(conn, :live_socket_id) == "accounts_sessions:#{Base.url_encode64(token)}"
      assert redirected_to(conn) == ~p"/"
      assert People.get_account_by_session_token(token)
    end

    test "clears everything previously stored in the session", %{conn: conn, account: account} do
      conn = conn |> put_session(:to_be_removed, "value") |> AccountAuth.log_in_account(account)
      refute get_session(conn, :to_be_removed)
    end

    test "redirects to the configured path", %{conn: conn, account: account} do
      conn = conn |> put_session(:account_return_to, "/hello") |> AccountAuth.log_in_account(account)
      assert redirected_to(conn) == "/hello"
    end

    test "writes a cookie if remember_me is configured", %{conn: conn, account: account} do
      conn = conn |> fetch_cookies() |> AccountAuth.log_in_account(account, %{"remember_me" => "true"})
      assert get_session(conn, :account_token) == conn.cookies[@remember_me_cookie]

      assert %{value: signed_token, max_age: max_age} = conn.resp_cookies[@remember_me_cookie]
      assert signed_token != get_session(conn, :account_token)
      assert max_age == 5_184_000
    end
  end

  describe "logout_account/1" do
    test "erases session and cookies", %{conn: conn, account: account} do
      account_token = People.generate_account_session_token(account)

      conn =
        conn
        |> put_session(:account_token, account_token)
        |> put_req_cookie(@remember_me_cookie, account_token)
        |> fetch_cookies()
        |> AccountAuth.log_out_account()

      refute get_session(conn, :account_token)
      refute conn.cookies[@remember_me_cookie]
      assert %{max_age: 0} = conn.resp_cookies[@remember_me_cookie]
      assert redirected_to(conn) == ~p"/"
      refute People.get_account_by_session_token(account_token)
    end

    test "broadcasts to the given live_socket_id", %{conn: conn} do
      live_socket_id = "accounts_sessions:abcdef-token"
      OperatelyWeb.Endpoint.subscribe(live_socket_id)

      conn
      |> put_session(:live_socket_id, live_socket_id)
      |> AccountAuth.log_out_account()

      assert_receive %Phoenix.Socket.Broadcast{event: "disconnect", topic: ^live_socket_id}
    end

    test "works even if account is already logged out", %{conn: conn} do
      conn = conn |> fetch_cookies() |> AccountAuth.log_out_account()
      refute get_session(conn, :account_token)
      assert %{max_age: 0} = conn.resp_cookies[@remember_me_cookie]
      assert redirected_to(conn) == ~p"/"
    end
  end

  describe "fetch_current_account/2" do
    test "authenticates account from session", %{conn: conn, account: account} do
      account_token = People.generate_account_session_token(account)
      conn = conn |> put_session(:account_token, account_token) |> AccountAuth.fetch_current_account([])
      assert conn.assigns.current_account.id == account.id
    end

    test "authenticates account from cookies", %{conn: conn, account: account} do
      logged_in_conn =
        conn |> fetch_cookies() |> AccountAuth.log_in_account(account, %{"remember_me" => "true"})

      account_token = logged_in_conn.cookies[@remember_me_cookie]
      %{value: signed_token} = logged_in_conn.resp_cookies[@remember_me_cookie]

      conn =
        conn
        |> put_req_cookie(@remember_me_cookie, signed_token)
        |> AccountAuth.fetch_current_account([])

      assert conn.assigns.current_account.id == account.id
      assert get_session(conn, :account_token) == account_token

      assert get_session(conn, :live_socket_id) ==
               "accounts_sessions:#{Base.url_encode64(account_token)}"
    end

    test "does not authenticate if data is missing", %{conn: conn, account: account} do
      _ = People.generate_account_session_token(account)
      conn = AccountAuth.fetch_current_account(conn, [])
      refute get_session(conn, :account_token)
      refute conn.assigns.current_account
    end
  end

  describe "on_mount: mount_current_account" do
    test "assigns current_account based on a valid account_token ", %{conn: conn, account: account} do
      account_token = People.generate_account_session_token(account)
      session = conn |> put_session(:account_token, account_token) |> get_session()

      {:cont, updated_socket} =
        AccountAuth.on_mount(:mount_current_account, %{}, session, %LiveView.Socket{})

      assert updated_socket.assigns.current_account.id == account.id
    end

    test "assigns nil to current_account assign if there isn't a valid account_token ", %{conn: conn} do
      account_token = "invalid_token"
      session = conn |> put_session(:account_token, account_token) |> get_session()

      {:cont, updated_socket} =
        AccountAuth.on_mount(:mount_current_account, %{}, session, %LiveView.Socket{})

      assert updated_socket.assigns.current_account == nil
    end

    test "assigns nil to current_account assign if there isn't a account_token", %{conn: conn} do
      session = conn |> get_session()

      {:cont, updated_socket} =
        AccountAuth.on_mount(:mount_current_account, %{}, session, %LiveView.Socket{})

      assert updated_socket.assigns.current_account == nil
    end
  end

  describe "on_mount: ensure_authenticated" do
    test "authenticates current_account based on a valid account_token ", %{conn: conn, account: account} do
      account_token = People.generate_account_session_token(account)
      session = conn |> put_session(:account_token, account_token) |> get_session()

      {:cont, updated_socket} =
        AccountAuth.on_mount(:ensure_authenticated, %{}, session, %LiveView.Socket{})

      assert updated_socket.assigns.current_account.id == account.id
    end

    test "redirects to login page if there isn't a valid account_token ", %{conn: conn} do
      account_token = "invalid_token"
      session = conn |> put_session(:account_token, account_token) |> get_session()

      socket = %LiveView.Socket{
        endpoint: OperatelyWeb.Endpoint,
        assigns: %{__changed__: %{}, flash: %{}}
      }

      {:halt, updated_socket} = AccountAuth.on_mount(:ensure_authenticated, %{}, session, socket)
      assert updated_socket.assigns.current_account == nil
    end

    test "redirects to login page if there isn't a account_token ", %{conn: conn} do
      session = conn |> get_session()

      socket = %LiveView.Socket{
        endpoint: OperatelyWeb.Endpoint,
        assigns: %{__changed__: %{}, flash: %{}}
      }

      {:halt, updated_socket} = AccountAuth.on_mount(:ensure_authenticated, %{}, session, socket)
      assert updated_socket.assigns.current_account == nil
    end
  end

  describe "on_mount: :redirect_if_account_is_authenticated" do
    test "redirects if there is an authenticated  account ", %{conn: conn, account: account} do
      account_token = People.generate_account_session_token(account)
      session = conn |> put_session(:account_token, account_token) |> get_session()

      assert {:halt, _updated_socket} =
               AccountAuth.on_mount(
                 :redirect_if_account_is_authenticated,
                 %{},
                 session,
                 %LiveView.Socket{}
               )
    end

    test "Don't redirect is there is no authenticated account", %{conn: conn} do
      session = conn |> get_session()

      assert {:cont, _updated_socket} =
               AccountAuth.on_mount(
                 :redirect_if_account_is_authenticated,
                 %{},
                 session,
                 %LiveView.Socket{}
               )
    end
  end

  describe "redirect_if_account_is_authenticated/2" do
    test "redirects if account is authenticated", %{conn: conn, account: account} do
      conn = conn |> assign(:current_account, account) |> AccountAuth.redirect_if_account_is_authenticated([])
      assert conn.halted
      assert redirected_to(conn) == ~p"/"
    end

    test "does not redirect if account is not authenticated", %{conn: conn} do
      conn = AccountAuth.redirect_if_account_is_authenticated(conn, [])
      refute conn.halted
      refute conn.status
    end
  end

  describe "require_authenticated_account/2" do
    test "redirects if account is not authenticated", %{conn: conn} do
      conn = conn |> fetch_flash() |> AccountAuth.require_authenticated_account([])
      assert conn.halted

      assert redirected_to(conn) == ~p"/accounts/log_in"

      assert Phoenix.Flash.get(conn.assigns.flash, :error) ==
               "You must log in to access this page."
    end

    test "stores the path to redirect to on GET", %{conn: conn} do
      halted_conn =
        %{conn | path_info: ["foo"], query_string: ""}
        |> fetch_flash()
        |> AccountAuth.require_authenticated_account([])

      assert halted_conn.halted
      assert get_session(halted_conn, :account_return_to) == "/foo"

      halted_conn =
        %{conn | path_info: ["foo"], query_string: "bar=baz"}
        |> fetch_flash()
        |> AccountAuth.require_authenticated_account([])

      assert halted_conn.halted
      assert get_session(halted_conn, :account_return_to) == "/foo?bar=baz"

      halted_conn =
        %{conn | path_info: ["foo"], query_string: "bar", method: "POST"}
        |> fetch_flash()
        |> AccountAuth.require_authenticated_account([])

      assert halted_conn.halted
      refute get_session(halted_conn, :account_return_to)
    end

    test "does not redirect if account is authenticated", %{conn: conn, account: account} do
      conn = conn |> assign(:current_account, account) |> AccountAuth.require_authenticated_account([])
      refute conn.halted
      refute conn.status
    end
  end
end
