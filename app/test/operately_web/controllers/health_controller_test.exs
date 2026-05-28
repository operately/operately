defmodule OperatelyWeb.HealthControllerTest do
  use OperatelyWeb.ConnCase

  test "GET /health", %{conn: conn} do
    conn = get(conn, "/health")
    assert text_response(conn, 200)
    assert conn.resp_body == "HEALTHY"
  end

  test "GET /health redirects external http requests when https is enabled", %{conn: conn} do
    original_scheme = System.get_env("OPERATELY_URL_SCHEME")
    original_auto_renew = System.get_env("CERT_AUTO_RENEW")
    original_config = Application.get_env(:operately, OperatelyWeb.Endpoint, [])

    on_exit(fn ->
      restore_env("OPERATELY_URL_SCHEME", original_scheme)
      restore_env("CERT_AUTO_RENEW", original_auto_renew)
      Application.put_env(:operately, OperatelyWeb.Endpoint, original_config)
    end)

    System.put_env("OPERATELY_URL_SCHEME", "https")
    System.put_env("CERT_AUTO_RENEW", "no")
    Application.put_env(:operately, OperatelyWeb.Endpoint, Keyword.put(original_config, :url, host: "app.operately.test"))

    conn =
      conn
      |> Map.put(:host, "public.example.com")
      |> get("/health")

    assert conn.status == 301
    assert get_resp_header(conn, "location") == ["https://app.operately.test/health"]
  end

  defp restore_env(key, nil), do: System.delete_env(key)
  defp restore_env(key, value), do: System.put_env(key, value)
end
