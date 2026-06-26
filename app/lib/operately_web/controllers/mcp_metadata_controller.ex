defmodule OperatelyWeb.McpMetadataController do
  use OperatelyWeb, :controller

  alias Operately.Mcp

  def protected_resource(conn, _params) do
    json(conn, protected_resource_metadata())
  end

  def authorization_server(conn, _params) do
    json(conn, authorization_server_metadata())
  end

  def cors_preflight(conn, _params) do
    send_resp(conn, 204, "")
  end

  defp protected_resource_metadata do
    %{
      resource: Mcp.canonical_resource_uri(),
      authorization_servers: [OperatelyWeb.Endpoint.url()],
      scopes_supported: Mcp.supported_scopes()
    }
  end

  defp authorization_server_metadata do
    base_url = OperatelyWeb.Endpoint.url()

    %{
      issuer: base_url,
      authorization_endpoint: base_url <> "/oauth/authorize",
      token_endpoint: base_url <> "/oauth/token",
      grant_types_supported: ["authorization_code", "refresh_token"],
      response_types_supported: ["code"],
      scopes_supported: Mcp.supported_scopes(),
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      client_id_metadata_document_supported: true
    }
  end
end
