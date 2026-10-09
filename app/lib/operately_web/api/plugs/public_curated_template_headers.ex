defmodule OperatelyWeb.Api.Plugs.PublicCuratedTemplateHeaders do
  @moduledoc """
  Enables cross-origin website requests with CORS/preflight handling and ETag
  cache revalidation for public template queries.
  """

  import Plug.Conn

  @paths ["/api/v2/curated_templates/list", "/api/v2/curated_templates/get"]

  def init(opts), do: opts

  # Run before TurboConnect matching so OPTIONS and input errors also receive CORS headers.
  def call(%{method: method, request_path: path} = conn, _opts) when method in ["GET", "OPTIONS"] and path in @paths do
    conn =
      conn
      |> put_resp_header("access-control-allow-origin", "*")
      |> put_resp_header("access-control-allow-methods", "GET, OPTIONS")
      |> put_resp_header("access-control-allow-headers", "If-None-Match, Content-Type")
      |> put_resp_header("access-control-expose-headers", "ETag")

    if method == "OPTIONS" do
      conn |> send_resp(204, "") |> halt()
    else
      register_before_send(conn, &revalidate/1)
    end
  end

  def call(conn, _opts), do: conn

  defp revalidate(%{status: 200} = conn) do
    etag = ~s("#{Base.encode16(:crypto.hash(:sha256, conn.resp_body), case: :lower)}")
    matches = conn |> get_req_header("if-none-match") |> Enum.flat_map(&String.split(&1, ",")) |> Enum.map(&String.trim/1)
    conn = conn |> put_resp_header("cache-control", "public, no-cache") |> put_resp_header("etag", etag)

    if etag in matches or ("W/" <> etag) in matches or "*" in matches,
      do: resp(conn, 304, ""),
      else: conn
  end

  defp revalidate(conn), do: put_resp_header(conn, "cache-control", "no-store")
end
