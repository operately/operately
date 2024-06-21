defmodule OperatelyWeb.Api.Queries.GetProjectTest do
  use OperatelyWeb.TurboCase

  import OperatelyWeb.Api.Serializer
  import Operately.ProjectsFixtures
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_projects, %{})
    end

    test "it is not possible to get a project from another company", ctx do
      ctx = register_and_log_in_account(ctx)
      project = create_project(ctx)

      other_company = company_fixture()
      other_person = person_fixture(company_id: other_company.id)
      other_project = create_project(ctx, company_id: other_company.id, creator_id: other_person.id)

      assert {404, "Not found"} = query(ctx.conn, :get_project, %{id: other_project.id})
      assert {200, _} = query(ctx.conn, :get_project, %{id: project.id})
    end
  end

  describe "get_project functionality" do
    setup :register_and_log_in_account

    test "get a project with nothing included", ctx do
      project = create_project(ctx)

      assert {200, res} = query(ctx.conn, :get_project, %{id: project.id})
      assert res.project == serialize(project, level: :full)
    end

    test "returns 400 if id is not provided", ctx do
      assert {400, "Bad request"} = query(ctx.conn, :get_project, %{})
    end

    test "include closed_by includes the person who closed the project if such exists", ctx do
      open_project = create_project(ctx)
      closed_project = create_project(ctx)
      closed_project = Operately.Projects.update_project(closed_project, %{closed_by_id: ctx.person.id})

      assert {200, res} = query(ctx.conn, :get_project, %{id: open_project.id, include_closed_by: true})
      assert res.project.closed_by == nil

      assert {200, res} = query(ctx.conn, :get_project, %{id: closed_project.id, include_closed_by: true})
      assert res.project.closed_by == serialize(ctx.person, level: :full)
    end
  end

  def create_project(ctx, attrs \\ %{}) do
    attrs = Map.merge(%{
      company_id: ctx.company.id, 
      name: "Project 1", 
      creator_id: ctx.person.id, 
      group_id: ctx.company.company_space_id
    }, attrs)

    project_fixture(attrs)
  end
end 
