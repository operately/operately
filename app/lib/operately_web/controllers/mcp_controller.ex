defmodule OperatelyWeb.MCPController do
  use OperatelyWeb, :controller

  alias Hermes.Server.Transport.StreamableHTTP.Plug, as: MCPPlug

  # Phoenix forbids `forward "/:company_id/mcp"` because `forward` only accepts
  # static paths. We still want Hermes' StreamableHTTP Plug to handle the MCP
  # protocol, so this controller exists as a thin wrapper: the router matches
  # `/:company_id/mcp` and we delegate the full request lifecycle to the Hermes
  # plug. See app/lib/operately_web/router.ex for the route definition.
  @plug_opts MCPPlug.init(server: Operately.MCP.Server)

  def proxy(conn, _params) do
    MCPPlug.call(conn, @plug_opts)
  end
end
