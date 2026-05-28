defmodule OperatelyWeb.Plugs.HttpsRedirectTest do
  use ExUnit.Case, async: false

  import Plug.Conn

  alias OperatelyWeb.Plugs.HttpsRedirect

  @endpoint_config Application.compile_env(:operately, OperatelyWeb.Endpoint)
  @env_keys ["CERT_AUTO_RENEW", "OPERATELY_URL_SCHEME"]

  setup do
    original_env = Map.new(@env_keys, &{&1, System.get_env(&1)})
    original_config = Application.get_env(:operately, OperatelyWeb.Endpoint, [])

    on_exit(fn ->
      Enum.each(original_env, fn
        {key, nil} -> System.delete_env(key)
        {key, value} -> System.put_env(key, value)
      end)

      Application.put_env(:operately, OperatelyWeb.Endpoint, original_config)
    end)

    Application.put_env(:operately, OperatelyWeb.Endpoint, Keyword.put(@endpoint_config, :url, host: "app.operately.test"))

    :ok
  end

  test "redirects GET requests to the configured https host and preserves query params" do
    System.put_env("CERT_AUTO_RENEW", "yes")

    conn =
      Plug.Test.conn("GET", "/projects?view=board")
      |> Map.put(:host, "ignored.example.com")
      |> HttpsRedirect.call([])

    assert conn.status == 301
    assert conn.halted
    assert get_resp_header(conn, "location") == ["https://app.operately.test/projects?view=board"]
  end

  test "uses a 307 redirect for non-GET requests" do
    System.put_env("CERT_AUTO_RENEW", "yes")

    conn =
      Plug.Test.conn("POST", "/accounts/log_in")
      |> HttpsRedirect.call([])

    assert conn.status == 307
    assert get_resp_header(conn, "location") == ["https://app.operately.test/accounts/log_in"]
  end

  test "does not redirect when single-host tls redirect is not enabled" do
    System.put_env("CERT_AUTO_RENEW", "no")

    conn =
      Plug.Test.conn("GET", "/health")
      |> HttpsRedirect.call([])

    assert conn.status == nil
    assert get_resp_header(conn, "location") == []
    refute conn.halted
  end

  test "does not redirect when only the canonical url scheme is https" do
    System.put_env("OPERATELY_URL_SCHEME", "https")
    System.put_env("CERT_AUTO_RENEW", "no")

    conn =
      Plug.Test.conn("GET", "/projects")
      |> HttpsRedirect.call([])

    assert conn.status == nil
    assert get_resp_header(conn, "location") == []
    refute conn.halted
  end

  test "allows localhost health checks over http" do
    System.put_env("CERT_AUTO_RENEW", "yes")

    localhost_conn =
      Plug.Test.conn("GET", "/health")
      |> Map.put(:host, "localhost")
      |> HttpsRedirect.call([])

    loopback_conn =
      Plug.Test.conn("GET", "/health/")
      |> Map.put(:host, "127.0.0.1")
      |> HttpsRedirect.call([])

    assert localhost_conn.status == nil
    refute localhost_conn.halted
    assert loopback_conn.status == nil
    refute loopback_conn.halted
  end

  test "does not redirect acme challenge requests" do
    System.put_env("CERT_AUTO_RENEW", "yes")

    conn =
      Plug.Test.conn("GET", "/.well-known/acme-challenge/challenge-token")
      |> HttpsRedirect.call([])

    assert conn.status == nil
    assert get_resp_header(conn, "location") == []
    refute conn.halted
  end

  test "does not redirect requests already marked as https by a proxy" do
    System.put_env("CERT_AUTO_RENEW", "yes")

    conn =
      Plug.Test.conn("GET", "/projects")
      |> put_req_header("x-forwarded-proto", "https")
      |> HttpsRedirect.call([])

    assert conn.status == nil
    assert get_resp_header(conn, "location") == []
    refute conn.halted
  end

  test "uses the first forwarded proto value when a proxy chain is present" do
    System.put_env("CERT_AUTO_RENEW", "yes")

    conn =
      Plug.Test.conn("GET", "/projects")
      |> put_req_header("x-forwarded-proto", "https, http")
      |> HttpsRedirect.call([])

    assert conn.status == nil
    assert get_resp_header(conn, "location") == []
    refute conn.halted
  end
end
