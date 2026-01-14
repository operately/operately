defmodule OperatelyWeb.Api.Queries.GetInvitationTest do
  use OperatelyWeb.TurboCase

  import Operately.InviteLinksFixtures

  describe "get_invitation functionality" do
    setup :register_and_log_in_account

    test "returns the invite link", %{conn: conn} do
      invite_link = personal_invite_link_fixture()
      invite_link = Operately.Repo.preload(invite_link, [:author, :person, :company])
      token = invite_link.token

      assert {200, res} = query(conn, [:invitations, :get_invitation], %{"token" => token})

      assert res.invite_link == Serializer.serialize(invite_link, level: :full)
    end

    test "result includes author and company", %{conn: conn} do
      invite_link = personal_invite_link_fixture()
      invite_link = Operately.Repo.preload(invite_link, [:author, :company])
      token = invite_link.token

      assert {200, res} = query(conn, [:invitations, :get_invitation], %{"token" => token})

      assert res.invite_link.author == Serializer.serialize(invite_link.author, level: :essential)
      assert res.invite_link.company == Serializer.serialize(invite_link.company, level: :essential)
    end

    test "result includes member", %{conn: conn} do
      invite_link = personal_invite_link_fixture()
      invite_link = Operately.Repo.preload(invite_link, [:person])
      token = invite_link.token

      assert {200, res} = query(conn, [:invitations, :get_invitation], %{"token" => token})

      assert res.member == Serializer.serialize(invite_link.person, level: :full)
    end
  end
end
