defmodule OperatelyWeb.Mcp.Plugs.ResolveCompany do
  alias Operately.Mcp
  alias OperatelyWeb.Mcp.Auth

  def init(opts), do: opts

  def call(conn, _opts) do
    grant = conn.assigns[:current_mcp_grant]
    account = conn.assigns[:current_account]

    with {:ok, {company, person}} <- Mcp.load_company_and_person(grant, account) do
      conn
      |> Plug.Conn.assign(:current_company, company)
      |> Plug.Conn.assign(:current_person, person)
    else
      {:error, :membership_revoked} ->
        Mcp.revoke_grant_for_reconnect(grant)
        Auth.unauthorized(conn)
    end
  end
end
