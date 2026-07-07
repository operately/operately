defmodule OperatelyWeb.McpMetadataControllerTest do
  use OperatelyWeb.ConnCase

  alias Operately.Mcp

  test "serves protected resource metadata", %{conn: conn} do
    conn = get(conn, "/.well-known/oauth-protected-resource/mcp")

    assert %{
             "resource" => resource,
             "authorization_servers" => authorization_servers,
             "scopes_supported" => scopes_supported,
             "default_scopes" => default_scopes
           } = Jason.decode!(conn.resp_body)

    assert conn.status == 200
    assert resource == Mcp.canonical_resource_uri()
    assert authorization_servers == [OperatelyWeb.Endpoint.url()]
    assert scopes_supported == Mcp.supported_scopes()
    assert default_scopes == Mcp.default_scopes()
  end

  test "serves authorization server metadata", %{conn: conn} do
    conn = get(conn, "/.well-known/oauth-authorization-server")

    assert %{
             "issuer" => issuer,
             "authorization_endpoint" => authorization_endpoint,
             "token_endpoint" => token_endpoint,
             "registration_endpoint" => registration_endpoint,
             "grant_types_supported" => grant_types_supported,
             "code_challenge_methods_supported" => code_challenge_methods_supported,
             "client_id_metadata_document_supported" => client_id_metadata_document_supported,
             "default_scopes" => default_scopes
           } = Jason.decode!(conn.resp_body)

    assert conn.status == 200
    assert issuer == OperatelyWeb.Endpoint.url()
    assert authorization_endpoint == OperatelyWeb.Endpoint.url() <> "/oauth/authorize"
    assert token_endpoint == OperatelyWeb.Endpoint.url() <> "/oauth/token"
    assert registration_endpoint == OperatelyWeb.Endpoint.url() <> "/oauth/register"
    assert grant_types_supported == ["authorization_code", "refresh_token"]
    assert code_challenge_methods_supported == ["S256"]
    assert client_id_metadata_document_supported == true
    assert default_scopes == Mcp.default_scopes()
  end

  test "serves authorization server metadata on the mcp-scoped discovery path", %{conn: conn} do
    root_conn = get(conn, "/.well-known/oauth-authorization-server")
    mcp_conn = get(build_conn(), "/.well-known/oauth-authorization-server/mcp")

    assert mcp_conn.status == 200
    assert Jason.decode!(mcp_conn.resp_body) == Jason.decode!(root_conn.resp_body)
  end

  test "serves openid configuration metadata", %{conn: conn} do
    conn = get(conn, "/.well-known/openid-configuration")

    assert %{
             "issuer" => issuer,
             "authorization_endpoint" => authorization_endpoint,
             "token_endpoint" => token_endpoint,
             "grant_types_supported" => grant_types_supported,
             "code_challenge_methods_supported" => code_challenge_methods_supported,
             "client_id_metadata_document_supported" => client_id_metadata_document_supported
           } = Jason.decode!(conn.resp_body)

    assert conn.status == 200
    assert issuer == OperatelyWeb.Endpoint.url()
    assert authorization_endpoint == OperatelyWeb.Endpoint.url() <> "/oauth/authorize"
    assert token_endpoint == OperatelyWeb.Endpoint.url() <> "/oauth/token"
    assert grant_types_supported == ["authorization_code", "refresh_token"]
    assert code_challenge_methods_supported == ["S256"]
    assert client_id_metadata_document_supported == true
  end

  test "serves openid configuration metadata on the mcp-scoped discovery path", %{conn: conn} do
    root_conn = get(conn, "/.well-known/openid-configuration")
    mcp_conn = get(build_conn(), "/.well-known/openid-configuration/mcp")

    assert mcp_conn.status == 200
    assert Jason.decode!(mcp_conn.resp_body) == Jason.decode!(root_conn.resp_body)
  end

  test "openid configuration matches authorization server metadata", %{conn: conn} do
    auth_server_conn = get(conn, "/.well-known/oauth-authorization-server")
    openid_conn = get(build_conn(), "/.well-known/openid-configuration")

    assert Jason.decode!(openid_conn.resp_body) == Jason.decode!(auth_server_conn.resp_body)
  end

  test "responds to discovery OPTIONS preflight", %{conn: conn} do
    conn =
      conn
      |> put_req_header("origin", "https://chatgpt.com")
      |> put_req_header("access-control-request-method", "GET")
      |> options("/.well-known/oauth-authorization-server/mcp")

    assert conn.status == 204
    assert get_resp_header(conn, "access-control-allow-origin") == ["https://chatgpt.com"]
    assert get_resp_header(conn, "access-control-allow-methods") == ["GET, OPTIONS"]
  end

  test "responds to openid configuration OPTIONS preflight", %{conn: conn} do
    conn =
      conn
      |> put_req_header("origin", "https://chatgpt.com")
      |> put_req_header("access-control-request-method", "GET")
      |> options("/.well-known/openid-configuration")

    assert conn.status == 204
    assert get_resp_header(conn, "access-control-allow-origin") == ["https://chatgpt.com"]
    assert get_resp_header(conn, "access-control-allow-methods") == ["GET, OPTIONS"]
  end
end
