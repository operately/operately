defmodule OperatelyWeb.Api.Mutations.EditDiscussionTest do
  use OperatelyWeb.TurboCase

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_company, %{})
    end
  end

  describe "authorization" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_member(:member)
      |> Factory.add_company_admin(:admin)
      |> Factory.add_company_owner(:owner)
    end

    test "company members can't edit", ctx do
      ctx = Factory.log_in_person(ctx, :member)
      assert {403, _} = mutation(ctx.conn, :edit_company, %{})
    end

    test "company admin can edit", ctx do
      ctx = Factory.log_in_person(ctx, :admin)
      assert {200, _} = mutation(ctx.conn, :edit_company, %{name: "Hello"})
    end

    test "company owner can edit", ctx do
      ctx = Factory.log_in_person(ctx, :owner)
      assert {200, _} = mutation(ctx.conn, :edit_company, %{name: "Hello"})
    end
  end

  describe "functionality" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_company_owner(:owner)
      |> Factory.log_in_person(:owner)
    end

    test "it changes the company name", ctx do
      assert {200, _} = mutation(ctx.conn, :edit_company, %{name: "Hello"})
      
      company = Operately.Companies.get_company!(ctx.company.id)
      assert company.name == "Hello"
    end
  end
end
