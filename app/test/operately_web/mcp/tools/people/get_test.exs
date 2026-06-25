defmodule OperatelyWeb.Mcp.Tools.People.GetTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.People
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.People.Get
  alias OperatelyWeb.Paths

  test "call/2 returns one person" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    me = People.get_person(account, company)
    coworker = person_fixture(%{company_id: company.id, full_name: "Taylor Coworker"})

    conn = ToolConnHelper.conn_with_assigns(account, company, me)

    assert {:ok, %{person: person}} = Get.call(conn, %{"person_id" => Paths.person_id(coworker)})
    assert person.id == Paths.person_id(coworker)
    assert person.full_name == coworker.full_name
  end

  test "call/2 rejects malformed identifiers" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    me = People.get_person(account, company)

    conn = ToolConnHelper.conn_with_assigns(account, company, me)

    assert {:error, :invalid_arguments} = Get.call(conn, %{"person_id" => "definitely-not-a-valid-operately-id-%%%"})
  end
end
