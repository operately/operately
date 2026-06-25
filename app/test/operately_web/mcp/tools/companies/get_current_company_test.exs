defmodule OperatelyWeb.Mcp.Tools.Companies.GetCurrentCompanyTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Plug.Conn
  alias Operately.People
  alias OperatelyWeb.Mcp.Tools.Companies.GetCurrentCompany
  alias OperatelyWeb.Paths

  describe "call/2" do
    test "returns the serialized authenticated company" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      conn = conn_with_assigns(account, company, person)

      assert {:ok, %{company: serialized_company}} = GetCurrentCompany.call(conn, %{})

      assert serialized_company.id == Paths.company_id(company)
      assert serialized_company.name == company.name
      assert serialized_company.setup_completed == company.setup_completed
      assert serialized_company.people == nil
      assert serialized_company.admins == nil
      assert serialized_company.owners == nil
      assert serialized_company.permissions == nil
      assert serialized_company.general_space == nil
    end

    test "returns not_found when the current company is not accessible to the authenticated person" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      other_account = account_fixture()
      other_company = company_fixture(%{company_name: "Other Company"}, other_account)

      conn = conn_with_assigns(account, other_company, person)

      assert {:error, :not_found} = GetCurrentCompany.call(conn, %{})
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
