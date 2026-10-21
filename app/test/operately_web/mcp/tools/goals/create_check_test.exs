defmodule OperatelyWeb.Mcp.Tools.Goals.CreateCheckTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures

  alias Operately.Goals.Check
  alias Operately.People
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Executor
  alias OperatelyWeb.Mcp.Tools.Goals.CreateCheck
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 adds a checklist item to a goal" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])

    assert {:ok, %{success: true, check_id: check_id}} =
             CreateCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "name" => String.duplicate("č", 2000)
             })

    check = Repo.get!(Check, ToolConnHelper.decode_id!(check_id))
    assert check.goal_id == ctx.goal.id
    assert check.name == String.duplicate("č", 2000)
    refute check.completed
  end

  test "returns a bad request for an oversized name without inserting a check" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)

    assert {:error, :bad_request, _message} =
             CreateCheck.call(ToolConnHelper.conn(ctx), %{"goal_id" => Paths.goal_id(ctx.goal), "name" => String.duplicate("č", 2001)})

    refute Repo.get_by(Check, goal_id: ctx.goal.id)
  end

  test "returns a translated tool error for a blank or oversized name" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_goal(:goal, :space)
    assert {:ok, definition} = Executor.fetch_definition("create_goal_check")

    for {name, message} <- [{"", "can't be blank"}, {String.duplicate("😀", 2001), "should be at most 2000 character(s)"}] do
      assert {:ok, %{"isError" => true, "content" => [%{"type" => "text", "text" => ^message}]}} =
               Executor.execute(ToolConnHelper.conn(ctx), definition, %{"goal_id" => Paths.goal_id(ctx.goal), "name" => name})

      refute Repo.get_by(Check, goal_id: ctx.goal.id)
    end
  end

  test "returns invalid_arguments for a malformed goal id" do
    ctx = Factory.setup(%{})

    assert {:error, :invalid_arguments} =
             CreateCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => "definitely-not-a-valid-operately-id-%%%",
               "name" => "Launch the onboarding rewrite"
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
             CreateCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(other_goal),
               "name" => "Launch the onboarding rewrite"
             })
  end
end
