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
               "name" => "Launch the onboarding rewrite"
             })

    check = Repo.get!(Check, ToolConnHelper.decode_id!(check_id))
    assert check.goal_id == ctx.goal.id
    assert check.name == "Launch the onboarding rewrite"
    refute check.completed
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

  test "returns a validation error for an oversized name" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    assert {:error, :bad_request, message} =
             CreateCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "name" => String.duplicate("a", 256)
             })

    assert message =~ "255"
    assert CreateCheck.definition().input_schema["properties"]["name"]["maxLength"] == 255
  end

  test "executor returns localized validation errors for invalid names without creating checks" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)

    conn = ToolConnHelper.conn(ctx)
    assert {:ok, definition} = Executor.fetch_definition("create_goal_check")
    checks_before = Repo.aggregate(Check, :count)
    activities_before = Repo.aggregate(Operately.Activities.Activity, :count)

    for locale <- ["en", "pt_BR"], name <- ["", "   ", String.duplicate("a", 256)] do
      Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
        arguments = %{"goal_id" => Paths.goal_id(ctx.goal), "name" => name}
        assert {:error, :bad_request, message} = CreateCheck.call(conn, arguments)

        assert {:ok, result} = Executor.execute(conn, definition, arguments)
        assert result == %{"isError" => true, "content" => [%{"type" => "text", "text" => message}]}
        assert Repo.aggregate(Check, :count) == checks_before
        assert Repo.aggregate(Operately.Activities.Activity, :count) == activities_before
      end)
    end
  end
end
