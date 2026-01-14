defmodule OperatelyWeb.Api.Queries.GetInvitationTest do
  use OperatelyWeb.TurboCase

  import Operately.InviteLinksFixtures

  describe "get_invitation functionality" do
    setup :register_and_log_in_account

    test "returns the invite link", %{conn: conn} do
      invite_link = personal_invite_link_fixture()
      invite_link = Operately.Repo.preload(invite_link, [:author, :person])
      token = invite_link.token

      assert {200, res} = query(conn, [:invitations, :get_invitation], %{"token" => token})

      assert res.invite_link == Serializer.serialize(invite_link, level: :essential)
    end
  end
end
