defmodule OperatelyWeb.Mcp.Tools.Goals.CreateTargetTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Goals.Target
  alias Operately.People
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Goals.CreateTarget
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 adds a target to a goal" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])

    assert {:ok, %{success: true, target_id: target_id}} =
             CreateTarget.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "name" => "Monthly revenue",
               "start_value" => 10,
               "target_value" => 50.5,
               "unit" => "USD"
             })

    target = Repo.get!(Target, ToolConnHelper.decode_id!(target_id))
    assert target.goal_id == ctx.goal.id
    assert target.name == "Monthly revenue"
    assert target.from == 10.0
    assert target.to == 50.5
    assert target.value == 10.0
    assert target.unit == "USD"
  end

  test "returns invalid_arguments for a malformed goal id" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             CreateTarget.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => "definitely-not-a-valid-operately-id-%%%",
               "name" => "Monthly revenue",
               "start_value" => 10,
               "target_value" => 50,
               "unit" => "USD"
             })
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

    ctx = %{account: account, company: company, creator: person}

    assert {:error, :not_found, _} =
             CreateTarget.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(other_goal),
               "name" => "Monthly revenue",
               "start_value" => 10,
               "target_value" => 50,
               "unit" => "USD"
             })
  end
end
