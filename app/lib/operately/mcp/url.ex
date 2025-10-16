defmodule Operately.MCP.URL do
  @moduledoc false

  alias Operately.Companies.Company
  alias OperatelyWeb.Paths

  def resource_uri(conn, %Company{} = company) do
    base_uri(conn, company_slug(company)) <> "/mcp"
  end

  def resource_uri(conn, company_slug) when is_binary(company_slug) do
    base_uri(conn, company_slug) <> "/mcp"
  end

  def protected_resource_metadata_uri(conn, company_slug) do
    base_uri(conn, company_slug) <> "/.well-known/oauth-protected-resource"
  end

  def authorization_server_metadata_uri(conn, company_slug) do
    base_uri(conn, company_slug) <> "/.well-known/oauth-authorization-server"
  end

  def authorize_endpoint(conn, company_slug) do
    base_uri(conn, company_slug) <> "/mcp/oauth/authorize"
  end

  def token_endpoint(conn, company_slug) do
    base_uri(conn, company_slug) <> "/mcp/oauth/token"
  end

  def company_slug(conn) do
    conn.path_params["company_id"]
  end

  def company_slug(%Company{} = company), do: Paths.company_id(company)

  def base_uri(conn, company_slug) do
    scheme = conn.scheme |> to_string()
    host = conn.host
    port = conn.port
    default_port = default_port_for_scheme(scheme)

    base =
      if is_nil(port) or port == default_port do
        "#{scheme}://#{host}"
      else
        "#{scheme}://#{host}:#{port}"
      end

    base <> "/#{company_slug}"
  end

  defp default_port_for_scheme("https"), do: 443
  defp default_port_for_scheme("http"), do: 80
  defp default_port_for_scheme(_), do: nil
end
