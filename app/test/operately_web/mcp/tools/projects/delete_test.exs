defmodule OperatelyWeb.Mcp.Tools.Projects.DeleteTest do
  use Operately.DataCase, async: true

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.People
  alias Operately.Projects.Project
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.Delete
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 deletes a project" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    assert {:ok, %{project: project}} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(ctx.project)
             })

    assert project.id == Paths.project_id(ctx.project)
    refute Operately.Repo.get(Project, ctx.project.id)
  end

  test "returns not_found for a project outside the authenticated company" do
    account = account_fixture()
    company = company_fixture(%{company_name: "MCP Company"}, account)
    person = People.get_person(account, company)

    other_account = account_fixture()
    other_company = company_fixture(%{company_name: "Other Company"}, other_account)
    other_person = People.get_person(other_account, other_company)
    other_project = project_fixture(%{company_id: other_company.id, creator_id: other_person.id, group_id: other_company.company_space_id, name: "Other Project"})

    ctx = %{account: account, company: company, creator: person}

    assert {:error, :not_found, _} =
             Delete.call(ToolConnHelper.conn(ctx), %{
               "project_id" => Paths.project_id(other_project)
             })
  end
end
