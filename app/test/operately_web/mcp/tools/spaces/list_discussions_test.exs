defmodule OperatelyWeb.Mcp.Tools.Spaces.ListDiscussionsTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.GroupsFixtures
  import Operately.MessagesFixtures
  import Operately.PeopleFixtures

  alias Operately.People
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Spaces.ListDiscussions
  alias OperatelyWeb.Paths

  test "call/2 returns discussions for one space" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    me = People.get_person(account, company)
    space = group_fixture(me, %{company_id: company.id, name: "Roadmap Space"})
    board = messages_board_fixture(space.id)
    message = message_fixture(me.id, board.id, title: "Roadmap Discussion")

    conn = ToolConnHelper.conn_with_assigns(account, company, me)

    assert {:ok, %{discussions: discussions}} = ListDiscussions.call(conn, %{"space_id" => Paths.space_id(space)})
    assert Enum.map(discussions, & &1.id) == [Paths.message_id(message)]
  end
end
