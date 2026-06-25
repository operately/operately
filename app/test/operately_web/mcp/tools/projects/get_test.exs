defmodule OperatelyWeb.Mcp.Tools.Projects.GetTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Plug.Conn
  alias Operately.People
  alias OperatelyWeb.Mcp.Tools.Projects.Get
  alias OperatelyWeb.Paths

  describe "call/2" do
    test "returns a serialized project for an accessible resource" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: company.company_space_id, name: "Roadmap Project"})

      conn = conn_with_assigns(account, company, person)

      assert {:ok, %{project: serialized_project}} = Get.call(conn, %{"project_id" => Paths.project_id(project)})

      assert serialized_project.id == Paths.project_id(project)
      assert serialized_project.name == project.name
    end

    test "returns not_found for a project outside the authenticated company" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      other_account = account_fixture()
      other_company = company_fixture(%{company_name: "Other Company"}, other_account)
      other_person = People.get_person(other_account, other_company)
      other_project = project_fixture(%{company_id: other_company.id, creator_id: other_person.id, group_id: other_company.company_space_id, name: "Other Project"})

      conn = conn_with_assigns(account, company, person)

      assert {:error, :not_found} = Get.call(conn, %{"project_id" => Paths.project_id(other_project)})
    end

    test "returns invalid_arguments for malformed identifiers" do
      account = account_fixture()
      company = company_fixture(%{company_name: "MCP Company"}, account)
      person = People.get_person(account, company)

      conn = conn_with_assigns(account, company, person)

      assert {:error, :invalid_arguments} = Get.call(conn, %{"project_id" => "definitely-not-a-valid-operately-id-%%%"})
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
