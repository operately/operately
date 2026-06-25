defmodule OperatelyWeb.Mcp.Tools.Spaces.GetDiscussionTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.CommentsFixtures
  import Operately.GroupsFixtures
  import Operately.MessagesFixtures
  import Operately.PeopleFixtures

  alias Operately.People
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Spaces.GetDiscussion
  alias OperatelyWeb.Paths

  test "call/2 returns one discussion with comments" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    me = People.get_person(account, company)
    space = group_fixture(me, %{company_id: company.id, name: "Roadmap Space"})
    board = messages_board_fixture(space.id)
    message = message_fixture(me.id, board.id, title: "Roadmap Discussion")
    _comment = comment_fixture(me, %{entity_id: message.id, entity_type: :message})

    conn = ToolConnHelper.conn_with_assigns(account, company, me)

    assert {:ok, %{discussion: discussion}} = GetDiscussion.call(conn, %{"discussion_id" => Paths.message_id(message)})
    assert discussion.id == Paths.message_id(message)
    assert length(discussion.comments) == 1
  end
end
