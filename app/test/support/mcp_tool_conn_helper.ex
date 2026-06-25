defmodule OperatelyWeb.Mcp.ToolConnHelper do
  alias Plug.Conn

  def conn_with_assigns(account, company, person, scopes \\ ["mcp:read"]) do
    %Conn{}
    |> Map.put(:assigns, %{
      current_account: account,
      current_company: company,
      current_person: person,
      mcp_scopes: scopes,
      api_auth_mode: :mcp_oauth
    })
  end
end
