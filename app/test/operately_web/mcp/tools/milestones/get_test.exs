defmodule OperatelyWeb.Mcp.Tools.Milestones.GetTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.People
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Milestones.Get
  alias OperatelyWeb.Paths

  test "call/2 returns one milestone" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    me = People.get_person(account, company)
    space = group_fixture(me, %{company_id: company.id, name: "Roadmap Space"})
    project = project_fixture(%{company_id: company.id, creator_id: me.id, group_id: space.id, name: "Roadmap Project"})
    milestone = milestone_fixture(%{project_id: project.id, creator_id: me.id, title: "Roadmap Milestone"})

    conn = ToolConnHelper.conn_with_assigns(account, company, me)

    assert {:ok, %{milestone: serialized_milestone}} = Get.call(conn, %{"milestone_id" => Paths.milestone_id(milestone)})
    assert serialized_milestone.id == Paths.milestone_id(milestone)
  end
end
