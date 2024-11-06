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
  end

  describe "functionality" do
  end
end
