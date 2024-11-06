defmodule OperatelyWeb.Api.Mutations.RestoreCompanyMemberTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_owner(:owner)
    |> Factory.add_company_admin(:admin)
    |> Factory.add_company_member(:member)
    |> Factory.add_company_member(:person)
    |> Factory.suspend_company_member(:person)
  end

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :restore_company_member, %{})
    end
  end

  describe "permissions" do
    test "company members can't restore people", ctx do
      ctx = Factory.log_in_person(ctx, :member)
      assert {403, _} = request(ctx, ctx.person)
    end

    test "company admins can restore people", ctx do
      ctx = Factory.log_in_person(ctx, :admin)
      assert {200, _} = request(ctx, ctx.person)
    end

    test "company owners can restore people", ctx do
      ctx = Factory.log_in_person(ctx, :owner)
      assert {200, _} = request(ctx, ctx.person)
    end

    test "can't restore people from other companies", ctx do
      ctx2 = Factory.setup(%{})
      ctx2 = Factory.add_company_owner(ctx2, :person_from_other_company)

      ctx = Factory.log_in_person(ctx, :admin)
      assert {404, _} = request(ctx, ctx2.person_from_other_company)
    end
  end

  describe "functionality" do
    test "it restores a suspended person", ctx do
      person = Operately.Repo.reload(ctx.person)
      refute person.suspended_at == nil
      refute person.suspended == false

      ctx = Factory.log_in_person(ctx, :admin)
      assert {200, _} = request(ctx, ctx.person)

      person = Operately.Repo.reload(ctx.person)
      assert person.suspended_at == nil
      assert person.suspended == false
    end
  end

  defp request(ctx, person) do
    mutation(ctx.conn, :restore_company_member, %{
      person_id: Paths.person_id(person)
    })
  end
end
