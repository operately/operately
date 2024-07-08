defmodule OperatelyWeb.Api.Mutations.NewInvitationTokenTest do
  use OperatelyWeb.TurboCase

  import Operately.InvitationsFixtures
  import Operately.PeopleFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :new_invitation_token, %{})
    end

    test "regular member can't issue new invitation token", ctx do
      ctx = register_and_log_in_account(ctx)

      member = person_fixture(%{company_id: ctx.person.company_id})
      assert {400, res} = mutation(ctx.conn, :new_invitation_token, %{person_id: member.id})

      assert res == %{:error => "Bad request", :message => "Only admins can issue invitation tokens."}
    end
  end

  describe "mutation: NewInvitationToken" do
    setup :register_and_log_in_account
    setup :promote_to_admin

    setup ctx do
      ctx = Map.put(ctx, :member, person_fixture_with_account(%{company_id: ctx.company.id, full_name: "Unique Name"}))
      ctx = Map.put(ctx, :invitation , invitation_fixture(%{member_id: ctx.member.id, admin_id: ctx.person.id}))
      ctx
    end

    test "admin can issue new invitation token", ctx do
      assert {200, res} = mutation(ctx.conn, :new_invitation_token, %{person_id: ctx.member.id})
      assert res.invitation.token != nil 
    end

    test "no invitation associated with member", ctx do
      Operately.Repo.delete(ctx.invitation)
      assert {400, res} = mutation(ctx.conn, :new_invitation_token, %{person_id: ctx.member.id})
      assert res == %{:error => "Bad request", :message => "This member didn't join the company using an invitation token."}
    end
  end

  defp promote_to_admin(ctx) do
    {:ok, person} = Operately.People.update_person(ctx.person, %{company_role: :admin})
    %{ctx | person: person}
  end
end 
