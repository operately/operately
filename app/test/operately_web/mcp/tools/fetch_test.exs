defmodule OperatelyWeb.Mcp.Tools.FetchTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Plug.Conn
  alias Operately.People
  alias OperatelyWeb.Mcp.Tools.Fetch
  alias OperatelyWeb.Paths

  describe "call/2" do
    test "fetches supported project, goal, milestone, and space URLs" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      space = group_fixture(person, %{company_id: company.id, name: "Roadmap Space"})
      goal = goal_fixture(person, %{company_id: company.id, space_id: space.id, name: "Roadmap Goal"})
      project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: space.id, goal_id: goal.id, name: "Roadmap Project"})
      milestone = milestone_fixture(%{project_id: project.id, creator_id: person.id, title: "Roadmap Milestone"})

      conn = conn_with_assigns(account, company, person)

      assert {:ok, project_payload} = Fetch.call(conn, %{"url" => Paths.to_url(Paths.project_path(company, project))})
      assert project_payload.url == Paths.to_url(Paths.project_path(company, project))
      assert project_payload.resource.type == "project"
      assert is_binary(hd(project_payload.content).text)

      assert {:ok, goal_payload} = Fetch.call(conn, %{"url" => Paths.to_url(Paths.goal_path(company, goal))})
      assert goal_payload.url == Paths.to_url(Paths.goal_path(company, goal))
      assert goal_payload.resource.type == "goal"
      assert is_binary(hd(goal_payload.content).text)

      assert {:ok, milestone_payload} = Fetch.call(conn, %{"url" => Paths.to_url(Paths.project_milestone_path(company, milestone))})
      assert milestone_payload.url == Paths.to_url(Paths.project_milestone_path(company, milestone))
      assert milestone_payload.resource.type == "milestone"
      assert hd(milestone_payload.content).text =~ "# #{milestone.title}"

      assert {:ok, space_payload} = Fetch.call(conn, %{"url" => Paths.to_url(Paths.space_path(company, space))})
      assert space_payload.url == Paths.to_url(Paths.space_path(company, space))
      assert space_payload.resource.type == "space"
      assert hd(space_payload.content).text =~ "# #{space.name}"
    end

    test "rejects malformed or unsupported URLs" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      space = group_fixture(person, %{company_id: company.id, name: "Roadmap Space"})
      project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: space.id, name: "Roadmap Project"})
      milestone = milestone_fixture(%{project_id: project.id, creator_id: person.id, title: "Roadmap Milestone"})
      task = Operately.TasksFixtures.task_fixture(%{creator_id: person.id, milestone_id: milestone.id, project_id: project.id, name: "Roadmap Task"})
      space_task = Operately.TasksFixtures.task_fixture(%{creator_id: person.id, space_id: space.id, name: "Roadmap Space Task"})

      conn = conn_with_assigns(account, company, person)

      assert {:error, :invalid_arguments} = Fetch.call(conn, %{"url" => "not-a-url"})
      assert {:error, :invalid_arguments} = Fetch.call(conn, %{"url" => "https://evil.example.com/acme/projects/project_123"})
      assert {:error, :invalid_arguments} = Fetch.call(conn, %{"url" => Paths.to_url("/" <> Paths.company_id(company) <> "/people/person_123")})
      assert {:error, :invalid_arguments} = Fetch.call(conn, %{"url" => Paths.to_url(Paths.space_kanban_path(company, space))})
      assert {:error, :invalid_arguments} = Fetch.call(conn, %{"url" => Paths.to_url(Paths.project_task_path(company, task))})
      assert {:error, :invalid_arguments} = Fetch.call(conn, %{"url" => Paths.to_url(Paths.space_task_path(company, space, space_task))})
      assert {:error, :invalid_arguments} = Fetch.call(conn, %{"url" => Paths.to_url(Paths.project_task_path(company, task) <> "#ignored-fragment")})
      assert {:error, :invalid_arguments} = Fetch.call(conn, %{"url" => Paths.to_url(Paths.space_kanban_path(company, space) <> "?taskId=definitely-not-a-valid-operately-id-%%%")})
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
