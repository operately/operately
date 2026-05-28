defmodule OperatelyWeb.Plugs.HttpsRedirect do
  @behaviour Plug

  import Plug.Conn

  @localhost_hosts ["127.0.0.1", "localhost"]
  @health_paths ["/health", "/health/"]
  @safe_methods ["GET", "HEAD"]

  def init(opts), do: opts

  def call(conn, _opts) do
    cond do
      # Respect the original client scheme when a proxy terminates TLS upstream.
      request_scheme(conn) != :http -> conn
      not single_host_tls_redirect_enabled?() -> conn
      # ACME HTTP-01 must stay reachable over plain HTTP for certificate issuance.
      acme_challenge?(conn.request_path) -> conn
      # Docker's local health probe still talks to the app over HTTP.
      localhost_health_check?(conn) -> conn
      true -> redirect_to_https(conn)
    end
  end

  # Only the single-host installer flow with app-managed certs uses this redirect.
  defp single_host_tls_redirect_enabled? do
    System.get_env("CERT_AUTO_RENEW") == "yes"
  end

  defp acme_challenge?(request_path) do
    String.starts_with?(request_path, "/.well-known/acme-challenge/")
  end

  defp localhost_health_check?(conn) do
    conn.host in @localhost_hosts and conn.request_path in @health_paths
  end

  defp redirect_to_https(conn) do
    conn
    |> put_resp_header("location", redirect_url(conn))
    |> send_resp(redirect_status(conn.method), "")
    |> halt()
  end

  defp redirect_status(method) when method in @safe_methods, do: 301
  defp redirect_status(_method), do: 307

  # `x-forwarded-proto` may contain a comma-separated proxy chain.
  defp request_scheme(conn) do
    case forwarded_proto(conn) do
      "https" -> :https
      "http" -> :http
      _ -> conn.scheme
    end
  end

  defp forwarded_proto(conn) do
    conn
    |> get_req_header("x-forwarded-proto")
    |> List.first()
    |> first_forwarded_value()
    |> normalize_forwarded_proto()
  end

  defp redirect_url(conn) do
    endpoint_url = endpoint_url()

    %URI{
      scheme: "https",
      host: endpoint_url.host,
      port: endpoint_url.port,
      path: join_paths(endpoint_url.path, conn.request_path),
      query: blank_to_nil(conn.query_string)
    }
    |> URI.to_string()
  end

  # Build redirects from the app's canonical endpoint URL, not the request host.
  defp endpoint_url do
    config = Application.get_env(:operately, OperatelyWeb.Endpoint, [])
    url_config = Keyword.get(config, :url, [])

    %URI{
      host: Keyword.get(url_config, :host, OperatelyWeb.Endpoint.host()),
      path: Keyword.get(url_config, :path, ""),
      port: https_port(Keyword.get(url_config, :port))
    }
  end

  defp https_port(nil), do: nil
  defp https_port(443), do: nil
  defp https_port(port), do: port

  defp join_paths(nil, request_path), do: request_path
  defp join_paths("", request_path), do: request_path
  defp join_paths(prefix, request_path), do: String.trim_trailing(prefix, "/") <> request_path

  defp first_forwarded_value(nil), do: nil
  defp first_forwarded_value(value), do: value |> String.split(",", parts: 2) |> List.first()

  defp normalize_forwarded_proto(nil), do: nil
  defp normalize_forwarded_proto(value), do: value |> String.trim() |> String.downcase()

  defp blank_to_nil(""), do: nil
  defp blank_to_nil(query), do: query
end
