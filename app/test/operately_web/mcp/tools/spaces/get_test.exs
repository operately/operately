defmodule OperatelyWeb.Mcp.Tools.Spaces.GetTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.People
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Spaces.Get
  alias OperatelyWeb.Paths

  test "call/2 returns one space" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    me = People.get_person(account, company)
    space = group_fixture(me, %{company_id: company.id, name: "Roadmap Space"})

    conn = ToolConnHelper.conn_with_assigns(account, company, me)

    assert {:ok, %{space: serialized_space}} = Get.call(conn, %{"space_id" => Paths.space_id(space)})
    assert serialized_space.id == Paths.space_id(space)
    assert serialized_space.name == space.name
    assert is_map(serialized_space.access_levels)
    assert is_map(serialized_space.permissions)
    assert Enum.any?(serialized_space.members, &(&1.id == Paths.person_id(me)))
    assert is_boolean(serialized_space.tools.discussions_enabled)
    assert is_boolean(serialized_space.tools.resource_hub_enabled)
    refute Map.has_key?(serialized_space.tools, :projects)
    refute Map.has_key?(serialized_space.tools, :goals)
  end
end
