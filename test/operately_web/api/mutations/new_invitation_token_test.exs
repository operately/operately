defmodule OperatelyWeb.Api.Mutations.NewInvitationTokenTest do
  use OperatelyWeb.TurboCase

  import Operately.InvitationsFixtures
  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :new_invitation_token, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :view_access, expected: 403},
      %{company: :comment_access, expected: 403},
      %{company: :edit_access,    expected: 403},
      %{company: :full_access,    expected: 200},
    ]

    setup :register_and_log_in_account

    tabletest @table do
      test "if caller has levels company=#{@test.company}, then expect code=#{@test.expected}", ctx do
        set_caller_access_level(ctx, @test.company)
        member = person_fixture_with_account(%{company_id: ctx.company.id})
        invitation_fixture(%{member_id: member.id, admin_id: ctx.person.id})

        assert {code, res} = mutation(ctx.conn, :new_invitation_token, %{person_id: Paths.person_id(member)})

        assert code == @test.expected

        case @test.expected do
          200 -> assert assert res.invitation.token
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "new_invitation_token functionality" do
    setup :register_and_log_in_account

    setup ctx do
      member = person_fixture_with_account(%{company_id: ctx.company.id})
      set_caller_access_level(ctx, :full_access)

      Map.merge(ctx, %{member: member})
    end

    test "new invitation token is issued", ctx do
      invitation_fixture(%{member_id: ctx.member.id, admin_id: ctx.person.id})

      assert {200, res} = mutation(ctx.conn, :new_invitation_token, %{person_id: Paths.person_id(ctx.member)})
      assert res.invitation.token
    end

    test "no invitation associated with member", ctx do
      assert {400, res} = mutation(ctx.conn, :new_invitation_token, %{person_id: Paths.person_id(ctx.member)})
      assert res == %{
        error:  "Bad request",
        message: "This member didn't join the company using an invitation token.",
      }
    end
  end

  #
  # Helpers
  #

  defp set_caller_access_level(ctx, access_level) do
    if access_level == :full_access do
      Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)
    end
  end
end
