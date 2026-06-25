defmodule OperatelyWeb.Mcp.ExecutorTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Plug.Conn
  alias Operately.Mcp.{AccessToken, Grant}
  alias Operately.People
  alias OperatelyWeb.Mcp.Executor

  setup do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    person = People.get_person(account, company)

    conn =
      %Conn{}
      |> Map.put(:assigns, %{
        current_account: account,
        current_company: company,
        current_person: person,
        current_mcp_grant: %Grant{id: Ecto.UUID.generate()},
        current_mcp_access_token: %AccessToken{id: Ecto.UUID.generate()},
        mcp_scopes: ["mcp:read"],
        api_auth_mode: :mcp_oauth
      })

    %{company: company, conn: conn}
  end

  test "executes get_current_company through the live wrapper", %{company: company, conn: conn} do
    assert {:ok, definition} = Executor.fetch_definition("get_current_company")
    assert {:ok, result} = Executor.execute(conn, definition, %{})

    assert result["content"] == []
    assert result["structuredContent"]["company"]["name"] == company.name
  end

  test "returns a tool-level error for stubbed wrappers", %{conn: conn} do
    assert {:ok, definition} = Executor.fetch_definition("fetch")

    assert {:ok, result} =
             Executor.execute(conn, definition, %{
               "url" => "https://app.operately.com/acme/projects/project_123"
             })

    assert result["isError"] == true
    assert result["content"] == [%{"type" => "text", "text" => "The fetch tool is not implemented yet."}]
  end

  test "returns unknown tool for missing wrappers" do
    assert {:error, :unknown_tool} == Executor.fetch_definition("missing_tool")
  end

  test "requires an authenticated conn" do
    assert {:ok, definition} = Executor.fetch_definition("get_current_company")
    assert {:error, :authenticated_conn_required} = Executor.execute(%Conn{}, definition, %{})
  end
end
