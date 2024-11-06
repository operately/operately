defmodule OperatelyWeb.Api.Mutations.RestoreCompanyMemberTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx |> Factory.setup()
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :restore_company_member, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx
      |> Factory.add_company_owner(:owner)
      |> Factory.add_company_admin(:admin)
      |> Factory.add_company_member(:member)
      |> Factory.suspend_company_member(:person)
    end

    test "company members can't restore people", ctx do
      ctx = Factory.log_in_person(ctx, :member)

      assert {403, _} = mutation(ctx.conn, :restore_company_member, %{
        person_id: Paths.person_id(ctx.person)
      })
    end

    test "company admins can restore people", ctx do
      ctx = Factory.log_in_person(ctx, :admin)

      assert {200, _} = mutation(ctx.conn, :restore_company_member, %{
        person_id: Paths.person_id(ctx.person)
      })
    end

    test "company owners can restore people", ctx do
      ctx = Factory.log_in_person(ctx, :owner)

      assert {403, _} = mutation(ctx.conn, :restore_company_member, %{})
    end

    test "can't restore people from other companies", ctx do
      assert {403, _} = mutation(ctx.conn, :restore_company_member, %{})
    end
  end

  describe "functionality" do
    test "it restores a suspended person", ctx do
      assert {200, _} = mutation(ctx.conn, :restore_company_member, %{})
    end
  end
end
