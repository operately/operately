defmodule OperatelyWeb.Mcp.Tools.Tasks.GetTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Plug.Conn
  alias Operately.People
  alias OperatelyWeb.Mcp.Tools.Tasks.Get
  alias OperatelyWeb.Paths

  describe "call/2" do
    test "returns a serialized task for an accessible resource" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: company.company_space_id, name: "Roadmap Project"})
      milestone = milestone_fixture(%{project_id: project.id, creator_id: person.id, title: "Roadmap Milestone"})
      task = task_fixture(%{creator_id: person.id, milestone_id: milestone.id, project_id: project.id, name: "Roadmap Task"})

      conn = conn_with_assigns(account, company, person)

      assert {:ok, %{task: serialized_task}} = Get.call(conn, %{"task_id" => Paths.task_id(task)})

      assert serialized_task.id == Paths.task_id(task)
      assert serialized_task.name == task.name
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

      conn = conn_with_assigns(account, company, person)

      assert {:error, :not_found} = Get.call(conn, %{"task_id" => Paths.task_id(other_task)})
    end

    test "returns invalid_arguments for malformed identifiers" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      conn = conn_with_assigns(account, company, person)

      assert {:error, :invalid_arguments} = Get.call(conn, %{"task_id" => "definitely-not-a-valid-operately-id-%%%"})
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
