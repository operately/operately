defmodule OperatelyWeb.Api.Queries.GetInvitationTest do
  use OperatelyWeb.TurboCase

  import Operately.InviteLinksFixtures

  alias Operately.InviteLinks
  alias Operately.People
  alias Operately.Repo

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
      invite_link = Operately.Repo.preload(invite_link, [person: [:account]])
      token = invite_link.token

      assert {200, res} = query(conn, [:invitations, :get_invitation], %{"token" => token})

      assert res.member == Serializer.serialize(invite_link.person, level: :full)
    end

    test "returns invite even when account already logged in", %{conn: conn} do
      invite_link = personal_invite_link_fixture()
      invite_link = Operately.Repo.preload(invite_link, [person: [:account]])
      person = invite_link.person
      {:ok, _} = People.mark_account_first_login(person.account)

      assert {200, res} = query(conn, [:invitations, :get_invitation], %{"token" => invite_link.token})

      person = person.id |> People.get_person!() |> Repo.preload(:account)
      assert res.member == Serializer.serialize(person, level: :full)
    end
  end

  describe "invalid tokens" do
    test "returns not found for an unknown token", %{conn: conn} do
      assert {404, _} = query(conn, [:invitations, :get_invitation], %{"token" => "missing-token"})
    end

    test "returns not found for an inactive token", %{conn: conn} do
      invite_link = personal_invite_link_fixture()
      {:ok, _} = InviteLinks.revoke_invite_link(invite_link)

      assert {404, _} = query(conn, [:invitations, :get_invitation], %{"token" => invite_link.token})
    end

    test "returns not found for an expired token", %{conn: conn} do
      invite_link = personal_invite_link_fixture()

      {:ok, _} =
        Repo.update(
          Ecto.Changeset.change(invite_link, %{
            expires_at: DateTime.add(DateTime.utc_now(), -1, :second) |> DateTime.truncate(:second)
          })
        )

      assert {404, _} = query(conn, [:invitations, :get_invitation], %{"token" => invite_link.token})
    end

    test "returns not found for a personal invite with no person", %{conn: conn} do
      invite_link = personal_invite_link_fixture()
      {:ok, invite_link} = InviteLinks.update_invite_link(invite_link, %{person_id: nil})

      assert {404, _} = query(conn, [:invitations, :get_invitation], %{"token" => invite_link.token})
    end

    test "returns not found for a company-wide invite token", %{conn: conn} do
      personal_link = personal_invite_link_fixture()

      {:ok, company_wide} =
        InviteLinks.create_invite_link(%{
          company_id: personal_link.company_id,
          author_id: personal_link.author_id
        })

      assert {404, _} = query(conn, [:invitations, :get_invitation], %{"token" => company_wide.token})
    end
  end
end
