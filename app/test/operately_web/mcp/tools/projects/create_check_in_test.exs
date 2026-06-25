defmodule OperatelyWeb.Mcp.Tools.Projects.CreateCheckInTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Notifications.SubscriptionList
  alias Operately.People
  alias Operately.Projects.CheckIn
  alias Operately.RichContent
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Projects.CreateCheckIn, as: CreateProjectCheckIn
  alias OperatelyWeb.Paths

  @valid_statuses ["on_track", "caution", "off_track"]

  describe "call/2" do
    test "creates a project check-in for each allowed status with safe defaults" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)
      project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: company.company_space_id})

      conn = ToolConnHelper.conn_with_assigns(account, company, person, ["mcp:read", "mcp:write"])

      Enum.each(@valid_statuses, fn status ->
        assert {:ok, %{check_in: check_in}} =
                 CreateProjectCheckIn.call(conn, %{
                   "project_id" => Paths.project_id(project),
                   "status" => status,
                   "content" => "**#{status}** update"
                 })

        assert check_in.status == status
        assert check_in.description |> Jason.decode!() |> RichContent.rich_content_to_string() |> normalize_text() == "#{status} update"

        {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(check_in.id)
        {:ok, list} = SubscriptionList.get(:system, parent_id: id, opts: [preload: :subscriptions])

        refute list.send_to_everyone
        assert Enum.map(list.subscriptions, & &1.person_id) == [person.id]
      end)

      assert Repo.aggregate(CheckIn, :count) == 3
    end

    test "returns invalid_arguments for malformed identifiers and blank content" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      conn = ToolConnHelper.conn_with_assigns(account, company, person, ["mcp:read", "mcp:write"])

      assert {:error, :invalid_arguments} =
               CreateProjectCheckIn.call(conn, %{
                 "project_id" => "definitely-not-a-valid-operately-id-%%%",
                 "status" => "on_track",
                 "content" => "Update"
               })

      project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: company.company_space_id})

      assert {:error, :invalid_arguments} =
               CreateProjectCheckIn.call(conn, %{
                 "project_id" => Paths.project_id(project),
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
