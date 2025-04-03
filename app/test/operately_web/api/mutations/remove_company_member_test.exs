defmodule OperatelyWeb.Api.Mutations.RemoveCompanyMemberTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :remove_company_member, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :view_access,    expected: 403},
      %{company: :comment_access, expected: 403},
      %{company: :edit_access,    expected: 403},
      %{company: :full_access,    expected: 200},
    ]

    setup :register_and_log_in_account

    tabletest @table do
      test "if caller has levels company=#{@test.company}, then expect code=#{@test.expected}", ctx do
        set_caller_access_level(ctx, @test.company)
        member = person_fixture_with_account(%{company_id: ctx.company.id})

        assert {code, res} = mutation(ctx.conn, :remove_company_member, %{person_id: Paths.person_id(member)})

        assert code == @test.expected

        case @test.expected do
          200 ->
            member = Repo.reload(member)
            member.suspended
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "remove_company_member functionality" do
    setup :register_and_log_in_account

    test "admin can remove members", ctx do
      set_caller_access_level(ctx, :full_access)
      member = person_fixture_with_account(%{company_id: ctx.company.id})

      assert {200, res} = mutation(ctx.conn, :remove_company_member, %{person_id: Paths.person_id(member)})
      member = Repo.reload(member)

      assert member.suspended
      assert member.suspended_at
      assert res.person == Serializer.serialize(member)
    end
  end

  #
  # Helpers
  #

  defp set_caller_access_level(ctx, access_level) do
    if access_level == :full_access do
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)
    end
  end
end
