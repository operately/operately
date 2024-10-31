defmodule OperatelyWeb.Api.Mutations.RemoveCompanyOwnerTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_owner(:owner)
    |> Factory.add_company_admin(:admin)
    |> Factory.add_company_member(:regular_member)
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = request(ctx, "")
    end

    test "regular members can't remove admins", ctx do
      ctx = Factory.log_in_person(ctx, :regular_member)

      assert {403, res} = request(ctx, ctx.owner)
      assert res.message == "You don't have permission to perform this action"
    end

    test "admins can't remove owners", ctx do
      ctx = Factory.log_in_person(ctx, :admin)

      assert {403, res} = request(ctx, ctx.owner)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company owners can remove owners", ctx do
      ctx = Factory.log_in_person(ctx, :creator)
      assert {200, _} = request(ctx, ctx.owner)
    end
  end

  def request(ctx, person_id) when is_binary(person_id) do
    mutation(ctx.conn, :remove_company_owner, %{person_id: person_id})
  end

  def request(ctx, person) do
    mutation(ctx.conn, :remove_company_owner, %{person_id: Paths.person_id(person)})
  end
end
