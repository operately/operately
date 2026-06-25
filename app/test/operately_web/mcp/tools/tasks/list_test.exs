defmodule OperatelyWeb.Mcp.Tools.Tasks.ListTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Plug.Conn
  alias Operately.People
  alias OperatelyWeb.Mcp.Tools.Tasks.List
  alias OperatelyWeb.Paths

  describe "call/2" do
    test "lists tasks for a project" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: company.company_space_id, name: "Roadmap Project"})
      milestone = milestone_fixture(%{project_id: project.id, creator_id: person.id, title: "Roadmap Milestone"})
      task = task_fixture(%{creator_id: person.id, milestone_id: milestone.id, project_id: project.id, name: "Roadmap Task"})

      conn = conn_with_assigns(account, company, person)

      assert {:ok, %{tasks: tasks}} = List.call(conn, %{"project_id" => Paths.project_id(project)})

      assert Enum.map(tasks, & &1.id) == [Paths.task_id(task)]
    end

    test "lists tasks for a space" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      space = group_fixture(person, %{company_id: company.id, name: "Roadmap Space"})
      task = task_fixture(%{creator_id: person.id, space_id: space.id, name: "Roadmap Task"})

      conn = conn_with_assigns(account, company, person)

      assert {:ok, %{tasks: tasks}} = List.call(conn, %{"space_id" => Paths.space_id(space)})

      assert Enum.map(tasks, & &1.id) == [Paths.task_id(task)]
    end

    test "rejects invalid argument combinations and malformed identifiers" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: company.company_space_id, name: "Roadmap Project"})
      space = group_fixture(person, %{company_id: company.id, name: "Roadmap Space"})

      conn = conn_with_assigns(account, company, person)

      assert {:error, :invalid_arguments} = List.call(conn, %{})
      assert {:error, :invalid_arguments} = List.call(conn, %{"project_id" => Paths.project_id(project), "space_id" => Paths.space_id(space)})
      assert {:error, :invalid_arguments} = List.call(conn, %{"project_id" => "definitely-not-a-valid-operately-id-%%%"})
      assert {:error, :invalid_arguments} = List.call(conn, %{"space_id" => "definitely-not-a-valid-operately-id-%%%"})
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
