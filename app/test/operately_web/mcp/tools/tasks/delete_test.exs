defmodule OperatelyWeb.Mcp.Tools.Tasks.DeleteTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Operately.People
  alias Operately.Support.Factory
  alias Operately.Tasks.Task
  alias OperatelyWeb.Mcp.Tools.Tasks.Delete
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a project task" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    assert {:ok, %{success: true}} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task)
             })

    refute Operately.Repo.get(Task, ctx.task.id)
  end

  test "returns invalid_arguments for a malformed task id" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "task_id" => "definitely-not-a-valid-operately-id-%%%"
             })
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

    ctx = %{account: account, company: company, creator: person}

    assert {:error, :not_found} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(other_task)
             })
  end
end
