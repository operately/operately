defmodule Operately.Api.Queries.GetProjectContributorTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = query(ctx.conn, :get_project_contributor, id: "1")
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:company_member)
      |> Factory.add_space(:product_space)
      |> Factory.add_space_member(:space_member, :product_space)
      |> Factory.add_project(:hello, :product_space)
      |> Factory.add_project_contributor(:developer, :hello)
    end

    test "company members", ctx do
      ctx = log_in_account(ctx, ctx.company_member)

      ctx = Factory.edit_project_company_members_access(ctx, :hello, :no_access)
      assert {404, _} = query(ctx.conn, :get_project_contributor, %{id: ctx.developer.id})

      ctx = Factory.edit_project_company_members_access(ctx, :hello, :view_access)
      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: ctx.developer.id})

      ctx = Factory.edit_project_company_members_access(ctx, :hello, :edit_access)
      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: ctx.developer.id})

      ctx = Factory.edit_project_company_members_access(ctx, :hello, :full_access)
      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: ctx.developer.id})
    end

    test "space members", ctx do
      ctx = log_in_account(ctx, ctx.space_member)

      ctx = Factory.edit_project_company_members_access(ctx, :hello, :no_access)

      ctx = Factory.edit_project_space_members_access(ctx, :hello, :no_access)
      assert {404, _} = query(ctx.conn, :get_project_contributor, %{id: ctx.developer.id})

      ctx = Factory.edit_project_space_members_access(ctx, :hello, :view_access)
      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: ctx.developer.id})

      ctx = Factory.edit_project_space_members_access(ctx, :hello, :edit_access)
      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: ctx.developer.id})

      ctx = Factory.edit_project_space_members_access(ctx, :hello, :full_access)
      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: ctx.developer.id})
    end

    test "project contributors", ctx do
      ctx = log_in_account(ctx, Operately.People.get_person!(ctx.developer.person_id))

      ctx = Factory.edit_project_company_members_access(ctx, :hello, :no_access)
      ctx = Factory.edit_project_space_members_access(ctx, :hello, :no_access)

      assert {200, _} = query(ctx.conn, :get_project_contributor, %{id: ctx.developer.id})
    end
  end
end
