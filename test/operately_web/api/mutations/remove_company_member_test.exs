defmodule OperatelyWeb.Api.Mutations.RemoveCompanyMemberTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :remove_company_member, %{})
    end

    test "regular member can't remove other members", ctx do
      ctx = register_and_log_in_account(ctx)

      member = person_fixture(company_id: ctx.person.company_id)
      assert {400, res} = mutation(ctx.conn, :remove_company_member, %{person_id: member.id})

      assert res == %{:error => "Bad request", :message => "Only admins can remove members"}
    end
  end

  describe "remove_company_member functionality" do
    setup :register_and_log_in_account
    setup :promote_to_admin

    setup ctx do
      Map.put(ctx, :member, person_fixture_with_account(%{company_id: ctx.company.id, full_name: "Unique Name"}))
    end

    test "admin can remove members", ctx do
      assert {200, _res} = mutation(ctx.conn, :remove_company_member, %{person_id: ctx.member.id})

      person = Operately.People.get_person_by_name!(ctx.company, ctx.member.full_name)
      assert person != nil
      assert person.suspended
      assert person.suspended_at != nil
    end
  end

  defp promote_to_admin(ctx) do
    {:ok, person} = Operately.People.update_person(ctx.person, %{company_role: :admin})
    %{ctx | person: person}
  end
end 
