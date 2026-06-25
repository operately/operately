defmodule OperatelyWeb.Mcp.Tools.Spaces.ListTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.People
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Spaces.List
  alias OperatelyWeb.Paths

  test "call/2 returns visible spaces" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    me = People.get_person(account, company)
    space = group_fixture(me, %{company_id: company.id, name: "Roadmap Space"})

    conn = ToolConnHelper.conn_with_assigns(account, company, me)

    assert {:ok, %{spaces: spaces}} = List.call(conn, %{})
    assert Paths.space_id(space) in Enum.map(spaces, & &1.id)
  end
end
