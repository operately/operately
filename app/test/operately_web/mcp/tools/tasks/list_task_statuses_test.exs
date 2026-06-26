defmodule OperatelyWeb.Mcp.Tools.Tasks.ListTaskStatusesTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Operately.People
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Tasks.ListTaskStatuses
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 returns statuses for a project task" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{task_statuses: task_statuses}} =
             ListTaskStatuses.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task)
             })

    assert length(task_statuses) > 0
    assert Enum.any?(task_statuses, &(&1.value == "done"))
    assert Enum.any?(task_statuses, &(&1.id))
    assert Enum.any?(task_statuses, &(&1.label))
  end

  test "call/2 returns statuses for a space task" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.create_space_task(:task, :space)

    space = Operately.Repo.preload(ctx.task, :space).space

    assert {:ok, %{task_statuses: task_statuses}} =
             ListTaskStatuses.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task)
             })

    assert length(task_statuses) == length(space.task_statuses)
    assert Enum.map(task_statuses, & &1.value) == Enum.map(space.task_statuses, & &1.value)
  end

  test "returns not_found for a task outside the authenticated company" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    person = People.get_person(account, company)

    other_account = account_fixture()
    other_company = company_fixture(%{company_name: "Other Company"}, other_account)
    other_person = People.get_person(other_account, other_company)
    other_project = project_fixture(%{company_id: other_company.id, creator_id: other_person.id, group_id: other_company.company_space_id, name: "Other Project"})
    other_milestone = milestone_fixture(%{project_id: other_project.id, creator_id: other_person.id, title: "Other Milestone"})
    other_task = task_fixture(%{creator_id: other_person.id, milestone_id: other_milestone.id, project_id: other_project.id, name: "Other Task"})

    conn = ToolConnHelper.conn_with_assigns(account, company, person)

    assert {:error, :not_found} =
             ListTaskStatuses.call(conn, %{"task_id" => Paths.task_id(other_task)})
  end

  test "returns invalid_arguments for malformed identifiers" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             ListTaskStatuses.call(ToolConnHelper.conn(ctx), %{
               "task_id" => "definitely-not-a-valid-operately-id-%%%"
             })
  end
end
