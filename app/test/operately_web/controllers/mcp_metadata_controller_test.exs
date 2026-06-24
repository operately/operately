defmodule OperatelyWeb.McpMetadataControllerTest do
  use OperatelyWeb.ConnCase

  alias Operately.Mcp

  test "serves protected resource metadata", %{conn: conn} do
    conn = get(conn, "/.well-known/oauth-protected-resource/mcp")

    assert %{
             "resource" => resource,
             "authorization_servers" => authorization_servers,
             "scopes_supported" => scopes_supported
           } = Jason.decode!(conn.resp_body)

    assert conn.status == 200
    assert resource == Mcp.canonical_resource_uri()
    assert authorization_servers == [OperatelyWeb.Endpoint.url()]
    assert scopes_supported == Mcp.supported_scopes()
  end

  test "serves authorization server metadata", %{conn: conn} do
    conn = get(conn, "/.well-known/oauth-authorization-server")

    assert %{
             "issuer" => issuer,
             "authorization_endpoint" => authorization_endpoint,
             "token_endpoint" => token_endpoint,
             "grant_types_supported" => grant_types_supported,
             "code_challenge_methods_supported" => code_challenge_methods_supported
           } = Jason.decode!(conn.resp_body)

    assert conn.status == 200
    assert issuer == OperatelyWeb.Endpoint.url()
    assert authorization_endpoint == OperatelyWeb.Endpoint.url() <> "/oauth/authorize"
    assert token_endpoint == OperatelyWeb.Endpoint.url() <> "/oauth/token"
    assert grant_types_supported == ["authorization_code", "refresh_token"]
    assert code_challenge_methods_supported == ["S256"]
  end
end
