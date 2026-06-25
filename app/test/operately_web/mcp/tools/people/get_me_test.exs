defmodule OperatelyWeb.Mcp.Tools.People.GetMeTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Plug.Conn
  alias Operately.People
  alias OperatelyWeb.Mcp.Tools.People.GetMe
  alias OperatelyWeb.Paths

  describe "call/2" do
    test "returns the authenticated member profile" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      conn = conn_with_assigns(account, company, person)

      assert {:ok, %{me: me}} = GetMe.call(conn, %{})

      assert me.id == Paths.person_id(person)
      assert me.full_name == person.full_name
      assert me.email == person.email
      assert me.manager == nil
    end
  end

  defp conn_with_assigns(account, company, person) do
    %Conn{}
    |> Map.put(:assigns, %{
      current_account: account,
      current_company: company,
      current_person: person,
      mcp_scopes: ["mcp:read"],
      api_auth_mode: :mcp_oauth
    })
  end
end
