defmodule OperatelyWeb.Api.Queries.GetInvitationTest do
  use OperatelyWeb.TurboCase

  import Operately.InvitationsFixtures

  describe "get_invitation functionality" do
    setup :register_and_log_in_account

    test "returns the invitation", %{conn: conn} do
      invitation = invitation_fixture() 
      invitation = invitation |> Operately.Repo.preload([:admin, :member])

      token = invitation_token_fixture_unhashed(invitation.id)

      assert {200, res} = query(conn, :get_invitation, %{"token" => token})

      assert res.invitation.admin == Serializer.serialize(invitation.admin, level: :essential)
      assert res.invitation.member == Serializer.serialize(invitation.member, level: :essential)
    end
  end

end 
