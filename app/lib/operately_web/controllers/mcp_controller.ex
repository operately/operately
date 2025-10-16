defmodule OperatelyWeb.MCPController do
  use OperatelyWeb, :controller

  alias Hermes.Server.Transport.StreamableHTTP.Plug, as: MCPPlug
  alias Operately.MCP.URL

  # Phoenix forbids `forward "/:company_id/mcp"` because `forward` only accepts
  # static paths. We still want Hermes' StreamableHTTP Plug to handle the MCP
  # protocol, so this controller exists as a thin wrapper: the router matches
  # `/:company_id/mcp` and we delegate the full request lifecycle to the Hermes
  # plug. See app/lib/operately_web/router.ex for the route definition.
  @plug_opts MCPPlug.init(server: Operately.MCP.Server)

  def proxy(conn, _params) do
    if authorized?(conn) do
      MCPPlug.call(conn, @plug_opts)
    else
      send_unauthorized(conn)
    end
  end

  defp authorized?(conn) do
    conn.assigns[:current_account] && conn.assigns[:current_company] && conn.assigns[:current_person]
  end

  defp send_unauthorized(conn) do
    company_slug = URL.company_slug(conn) || "unknown"
    metadata_url = URL.protected_resource_metadata_uri(conn, company_slug)
    realm = (conn.assigns[:current_company] && conn.assigns[:current_company].name) || "Operately MCP"

    body = Jason.encode!(%{error: "unauthorized"})

    conn
    |> put_resp_header("www-authenticate", ~s(Bearer realm="#{realm}", resource_metadata="#{metadata_url}"))
    |> send_resp(:unauthorized, body)
  end
end
