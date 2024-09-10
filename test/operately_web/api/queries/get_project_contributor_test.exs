defmodule Operately.Api.Queries.GetProjectContributorTest do
  use OperatelyWeb.TurboCase
  alias Operately.Support.Fixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_project_contributor, id: "1")
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Fixtures.setup()
      |> Fixtures.add_space(:product_space)
      |> Fixtures.add_project(:hello, space: :product_space)
      |> Fixtures.add_project_contributor(:project_manager, role: :contributor, project: :hello, responsibility: "Project Manager")
      |> Fixtures.add_company_member(:api_user)
      |> log_in_account(:api_user)
    end

    test "company members", ctx do
      contrib = Fixtures.get(ctx, :project_manager)

      ctx = Fixtures.edit_project_company_members_access(ctx, :hello, :no_access)
      assert {404, _} = query(ctx.conn, :get_project_contributor, %{id: contrib.id})

      ctx = Fixtures.edit_project_company_members_access(ctx, :hello, :view_access)
      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: contrib.id})

      ctx = Fixtures.edit_project_company_members_access(ctx, :hello, :edit_access)
      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: contrib.id})

      ctx = Fixtures.edit_project_company_members_access(ctx, :hello, :full_access)
      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: contrib.id})
    end

    test "space members", ctx do
      ctx = Fixtures.edit_project_company_members_access(ctx, :hello, :no_access)
      ctx = Fixtures.add_space_member(ctx, :api_user, :product_space)

      contrib = Fixtures.get(ctx, :project_manager)

      ctx = Fixtures.edit_project_space_members_access(ctx, :hello, :product_space, :no_access)
      assert {404, _} = query(ctx.conn, :get_project_contributor, %{id: contrib.id})

      ctx = Fixtures.edit_project_space_members_access(ctx, :hello, :product_space, :view_access)
      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: contrib.id})

      ctx = Fixtures.edit_project_space_members_access(ctx, :hello, :product_space, :edit_access)
      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: contrib.id})

      ctx = Fixtures.edit_project_space_members_access(ctx, :hello, :product_space, :full_access)
      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: contrib.id})
    end
  end
end
