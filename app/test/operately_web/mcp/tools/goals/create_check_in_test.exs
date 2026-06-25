defmodule OperatelyWeb.Mcp.Tools.Goals.CreateCheckInTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GoalsFixtures
  import Operately.PeopleFixtures

  alias Operately.Goals
  alias Operately.Notifications.SubscriptionList
  alias Operately.People
  alias Operately.RichContent
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Goals.CreateCheckIn, as: CreateGoalCheckIn
  alias OperatelyWeb.Paths

  @valid_statuses ["on_track", "caution", "off_track"]

  describe "call/2" do
    test "creates a goal check-in for each allowed status with safe defaults" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      goal = goal_fixture(person, %{space_id: company.company_space_id})

      conn = ToolConnHelper.conn_with_assigns(account, company, person, ["mcp:read", "mcp:write"])

      Enum.each(@valid_statuses, fn status ->
        assert {:ok, %{check_in: check_in}} =
                 CreateGoalCheckIn.call(conn, %{
                   "goal_id" => Paths.goal_id(goal),
                   "status" => status,
                   "content" => "# #{status}\n\nUpdate"
                 })

        assert check_in.status == status
        assert check_in.message |> Jason.decode!() |> RichContent.rich_content_to_string() |> normalize_text() == "#{status} Update"

        {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(check_in.id)
        {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

        refute list.send_to_everyone
        assert Enum.map(list.subscriptions, & &1.person_id) == [person.id]
      end)

      assert length(Goals.list_updates(goal)) == 3
    end

    test "returns invalid_arguments for malformed identifiers and blank content" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      conn = ToolConnHelper.conn_with_assigns(account, company, person, ["mcp:read", "mcp:write"])

      assert {:error, :invalid_arguments} =
               CreateGoalCheckIn.call(conn, %{
                 "goal_id" => "definitely-not-a-valid-operately-id-%%%",
                 "status" => "on_track",
                 "content" => "Update"
               })

      goal = goal_fixture(person, %{space_id: company.company_space_id})

      assert {:error, :invalid_arguments} =
               CreateGoalCheckIn.call(conn, %{
                 "goal_id" => Paths.goal_id(goal),
                 "status" => "on_track",
                 "content" => "   "
               })
    end
  end

  defp normalize_text(text) do
    text
    |> String.replace(~r/\s+/, " ")
    |> String.trim()
  end
end
