defmodule OperatelyWeb.Mcp.Tools.Goals.GetTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Plug.Conn
  alias Operately.People
  alias OperatelyWeb.Mcp.Tools.Goals.Get
  alias OperatelyWeb.Paths

  describe "call/2" do
    test "returns a serialized goal for an accessible resource" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      space = group_fixture(person, company_id: company.id)

      goal =
        goal_fixture(person, %{
          company_id: company.id,
          space_id: space.id
        })
        |> Repo.preload(:targets)

      conn = conn_with_assigns(account, company, person)

      assert {:ok, %{goal: serialized_goal}} = Get.call(conn, %{"goal_id" => Paths.goal_id(goal)})

      assert serialized_goal.id == Paths.goal_id(goal)
      assert serialized_goal.name == goal.name
      assert Enum.map(serialized_goal.targets, & &1.name) == Enum.map(goal.targets, & &1.name)
      assert serialized_goal.space == nil
      assert serialized_goal.champion == nil
      assert serialized_goal.reviewer == nil
      assert serialized_goal.permissions == nil
    end

    test "returns not_found for a goal outside the authenticated company" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      other_account = account_fixture()
      other_company = company_fixture(%{company_name: "Other Company"}, other_account)
      other_person = People.get_person(other_account, other_company)
      other_space = group_fixture(other_person, company_id: other_company.id)
      other_goal = goal_fixture(other_person, %{company_id: other_company.id, space_id: other_space.id})

      conn = conn_with_assigns(account, company, person)

      assert {:error, :not_found} = Get.call(conn, %{"goal_id" => Paths.goal_id(other_goal)})
    end

    test "returns invalid_goal_id for malformed identifiers" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      conn = conn_with_assigns(account, company, person)

      assert {:error, :invalid_goal_id} = Get.call(conn, %{"goal_id" => "definitely-not-a-valid-operately-id-%%%"})
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
