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
      |> Factory.
    end

    test "company members can't restore people", ctx do
      assert {403, _} = mutation(ctx.conn, :restore_company_member, %{})
    end

    test "company admins can restore people", ctx do
      assert {403, _} = mutation(ctx.conn, :restore_company_member, %{})
    end

    test "company owners can restore people", ctx do
      assert {403, _} = mutation(ctx.conn, :restore_company_member, %{})
    end

    test "can't restore people from other companies", ctx do
      assert {403, _} = mutation(ctx.conn, :restore_company_member, %{})
    end
  end

  describe "functionality" do
    test "it restores a suspended person", ctx do
      assert {:ok, %{} = result} = mutation(ctx.conn, :restore_company_member, %{})
    end
  end
end
