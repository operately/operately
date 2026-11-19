defmodule OperatelyWeb.Mcp.Tools.People.ListTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.People
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.People.List
  alias OperatelyWeb.Paths

  test "call/2 returns company members only" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    me = People.get_person(account, company)
    coworker = person_fixture(%{company_id: company.id, full_name: "Taylor Coworker"})

    other_account = account_fixture()
    other_company = company_fixture(%{company_name: "Other Company"}, other_account)
    _other_person = person_fixture(%{company_id: other_company.id, full_name: "Outside Person"})

    conn = ToolConnHelper.conn_with_assigns(account, company, me)

    assert {:ok, %{people: people}} = List.call(conn, %{})

    current_member = Enum.find(people, &(&1.id == Paths.person_id(me)))
    assert is_integer(current_member.access_level)
    assert is_boolean(current_member.has_open_invitation)
    assert current_member.invite_link == nil

    assert Enum.map(people, & &1.id) |> Enum.sort() == Enum.sort([Paths.person_id(me), Paths.person_id(coworker)])
  end
end
