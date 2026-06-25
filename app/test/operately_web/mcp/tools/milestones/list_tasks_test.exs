defmodule OperatelyWeb.Mcp.Tools.Milestones.ListTasksTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Operately.People
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Milestones.ListTasks
  alias OperatelyWeb.Paths

  test "call/2 returns tasks for one milestone" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    me = People.get_person(account, company)
    space = group_fixture(me, %{company_id: company.id, name: "Roadmap Space"})
    project = project_fixture(%{company_id: company.id, creator_id: me.id, group_id: space.id, name: "Roadmap Project"})
    milestone = milestone_fixture(%{project_id: project.id, creator_id: me.id, title: "Roadmap Milestone"})
    task = task_fixture(%{creator_id: me.id, milestone_id: milestone.id, project_id: project.id, name: "Roadmap Task"})

    conn = ToolConnHelper.conn_with_assigns(account, company, me)

    assert {:ok, %{tasks: tasks}} = ListTasks.call(conn, %{"milestone_id" => Paths.milestone_id(milestone)})
    assert Enum.map(tasks, & &1.id) == [Paths.task_id(task)]
  end
end
