defmodule OperatelyWeb.Mcp.Tools.Goals.ListTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Plug.Conn
  alias Operately.People
  alias OperatelyWeb.Mcp.Tools.Goals.List
  alias OperatelyWeb.Paths

  describe "call/2" do
    test "lists goals in the authenticated company" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      space = group_fixture(person, %{company_id: company.id, name: "Roadmap Space"})

      goal = goal_fixture(person, %{company_id: company.id, space_id: space.id, name: "Roadmap Goal"})

      other_account = account_fixture()
      other_company = company_fixture(%{company_name: "Other Company"}, other_account)
      other_person = People.get_person(other_account, other_company)
      other_space = group_fixture(other_person, %{company_id: other_company.id, name: "Other Space"})
      _other_goal = goal_fixture(other_person, %{company_id: other_company.id, space_id: other_space.id, name: "Other Goal"})

      conn = conn_with_assigns(account, company, person)

      assert {:ok, %{goals: goals}} = List.call(conn, %{})

      assert Enum.map(goals, & &1.id) == [Paths.goal_id(goal)]
    end

    test "filters by space" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      space = group_fixture(person, %{company_id: company.id, name: "Roadmap Space"})
      other_space = group_fixture(person, %{company_id: company.id, name: "Other Space"})

      goal = goal_fixture(person, %{company_id: company.id, space_id: space.id, name: "Roadmap Goal"})
      _other_goal = goal_fixture(person, %{company_id: company.id, space_id: other_space.id, name: "Other Goal"})

      conn = conn_with_assigns(account, company, person)

      assert {:ok, %{goals: goals}} = List.call(conn, %{"space_id" => Paths.space_id(space)})

      assert Enum.map(goals, & &1.id) == [Paths.goal_id(goal)]
    end

    test "returns invalid_arguments for malformed identifiers" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      conn = conn_with_assigns(account, company, person)

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
