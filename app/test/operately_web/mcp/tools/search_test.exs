defmodule OperatelyWeb.Mcp.Tools.SearchTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.TasksFixtures

  alias Plug.Conn
  alias Operately.People
  alias OperatelyWeb.Mcp.Tools.Search
  alias OperatelyWeb.Paths

  describe "call/2" do
    test "returns matching resources from the authenticated company only" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      space = group_fixture(person, %{company_id: company.id, name: "Roadmap Space"})
      goal = goal_fixture(person, %{company_id: company.id, space_id: space.id, name: "Roadmap Goal"})
      project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: space.id, goal_id: goal.id, name: "Roadmap Project"})
      milestone = milestone_fixture(%{project_id: project.id, creator_id: person.id, title: "Roadmap Milestone"})
      task = task_fixture(%{creator_id: person.id, milestone_id: milestone.id, project_id: project.id, name: "Roadmap Task"})

      other_account = account_fixture()
      other_company = company_fixture(%{company_name: "Other Company"}, other_account)
      other_person = People.get_person(other_account, other_company)
      _other_project = project_fixture(%{company_id: other_company.id, creator_id: other_person.id, group_id: other_company.company_space_id, name: "Roadmap Project"})

      conn = conn_with_assigns(account, company, person)

      assert {:ok, result} = Search.call(conn, %{"query" => "Roadmap"})

      assert is_list(result.spaces)
      assert Enum.map(result.projects, & &1.id) == [Paths.project_id(project)]
      assert Enum.map(result.goals, & &1.id) == [Paths.goal_id(goal)]
      assert Enum.map(result.milestones, & &1.id) == [Paths.milestone_id(milestone)]
      assert Enum.map(result.tasks, & &1.id) == [Paths.task_id(task)]
      assert is_list(result.people)
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
