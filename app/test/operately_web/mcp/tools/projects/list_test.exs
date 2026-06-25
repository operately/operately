defmodule OperatelyWeb.Mcp.Tools.Projects.ListTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Plug.Conn
  alias Operately.People
  alias OperatelyWeb.Mcp.Tools.Projects.List
  alias OperatelyWeb.Paths

  describe "call/2" do
    test "lists projects in the authenticated company" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: company.company_space_id, name: "Roadmap Project"})

      other_account = account_fixture()
      other_company = company_fixture(%{company_name: "Other Company"}, other_account)
      other_person = People.get_person(other_account, other_company)
      _other_project = project_fixture(%{company_id: other_company.id, creator_id: other_person.id, group_id: other_company.company_space_id, name: "Other Project"})

      conn = conn_with_assigns(account, company, person)

      assert {:ok, %{projects: projects}} = List.call(conn, %{})

      assert Enum.map(projects, & &1.id) == [Paths.project_id(project)]
    end

    test "filters by space and goal" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      space = group_fixture(person, %{company_id: company.id, name: "Roadmap Space"})
      other_space = group_fixture(person, %{company_id: company.id, name: "Other Space"})
      goal = goal_fixture(person, %{company_id: company.id, space_id: space.id, name: "Roadmap Goal"})
      other_goal = goal_fixture(person, %{company_id: company.id, space_id: other_space.id, name: "Other Goal"})

      project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: space.id, goal_id: goal.id, name: "Roadmap Project"})
      _other_project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: other_space.id, goal_id: other_goal.id, name: "Other Project"})

      conn = conn_with_assigns(account, company, person)

      assert {:ok, %{projects: space_projects}} = List.call(conn, %{"space_id" => Paths.space_id(space)})
      assert {:ok, %{projects: goal_projects}} = List.call(conn, %{"goal_id" => Paths.goal_id(goal)})

      assert Enum.map(space_projects, & &1.id) == [Paths.project_id(project)]
      assert Enum.map(goal_projects, & &1.id) == [Paths.project_id(project)]
    end

    test "returns invalid_arguments for malformed filters" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      conn = conn_with_assigns(account, company, person)

      assert {:error, :invalid_arguments} = List.call(conn, %{"space_id" => "definitely-not-a-valid-operately-id-%%%"})
      assert {:error, :invalid_arguments} = List.call(conn, %{"goal_id" => "definitely-not-a-valid-operately-id-%%%"})
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
