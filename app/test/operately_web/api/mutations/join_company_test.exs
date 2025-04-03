defmodule OperatelyWeb.Api.Mutations.JoinCompanyText do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.InvitationsFixtures

  setup ctx do
    invitation = invitation_fixture()
    token = Operately.Invitations.InvitationToken.build_token()

    Operately.Invitations.create_invitation_token!(%{
      invitation_id: invitation.id,
      token: token,
    })

    Map.put(ctx, :token, token)
  end

  describe "join_company functionality" do
    setup :register_and_log_in_account

    test "it fails if passwords don't match", ctx do
      payload = %{
        token: ctx.token,
        password: "Aa12345#&!123",
        password_confirmation: "123123123123123"
      }

      assert {400, res} = mutation(ctx.conn, :join_company, payload)
      assert res == %{error: "Bad request", message: "Passwords don't match"}
    end

    test "if fails if token is invalid", ctx do
      payload = %{
        token: "123123123123123",
        password: "Aa12345#&!123",
        password_confirmation: "Aa12345#&!123"
      }

      assert {400, res} = mutation(ctx.conn, :join_company, payload)
      assert res == %{error: "Bad request", message: "Invalid token"}
    end

    test "change password successfully", ctx do
      payload = %{
        token: ctx.token,
        password: "Aa12345#&!123",
        password_confirmation: "Aa12345#&!123"
      }

      assert {200, res} = mutation(ctx.conn, :join_company, payload)
      assert res.result == "Password successfully changed"
    end

    test "given account already has active person, updates new person without changing the password", ctx do
      ctx = setup_invitation_for_existing_account(ctx)

      assert {200, res} = mutation(ctx.conn, :join_company, %{token: ctx.token})
      assert res.result == "Successfully joined company"
    end
  end

  #
  # Helpers
  #

  defp setup_invitation_for_existing_account(ctx) do
    ctx = Factory.add_company(ctx,:other_company, ctx.account)
    person = person_fixture_with_account(%{company_id: ctx.other_company.id, full_name: "New Person"})

    invitation = invitation_fixture(%{member_id: person.id, admin_id: ctx.person.id})
    token = Operately.Invitations.InvitationToken.build_token()
    Operately.Invitations.create_invitation_token!(%{
      invitation_id: invitation.id,
      token: token,
    })

    Map.put(ctx, :token, token)
  end
end 
