defmodule Operately.Data.Change092BackfillPersonalInviteLinksForOpenInvitationsTest do
  use Operately.DataCase

  import Operately.PeopleFixtures

  alias Operately.InviteLinks
  alias Operately.Repo

  test "creates personal invite links only for open invitations" do
    invitation = create_invitation_fixture()
    company_id = invitation.member.company_id

    closed_member = create_person(%{company_id: company_id, has_open_invitation: false})
    {:ok, closed_invitation} = create_invitation(%{member_id: closed_member.id, admin_id: invitation.admin_id})

    valid_until = DateTime.utc_now() |> DateTime.add(3600, :second) |> DateTime.truncate(:second)
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    Repo.insert_all("invitation_tokens", [
      %{
        id: Ecto.UUID.generate() |> Ecto.UUID.dump!(),
        invitation_id: Ecto.UUID.dump!(invitation.id),
        hashed_token: "hash-open",
        valid_until: valid_until,
        inserted_at: now,
        updated_at: now
      },
      %{
        id: Ecto.UUID.generate() |> Ecto.UUID.dump!(),
        invitation_id: Ecto.UUID.dump!(closed_invitation.id),
        hashed_token: "hash-closed",
        valid_until: valid_until,
        inserted_at: now,
        updated_at: now
      }
    ])

    Operately.Data.Change092BackfillPersonalInviteLinksForOpenInvitations.run()

    {:ok, invite_link} = InviteLinks.get_personal_invite_link_for_person(invitation.member_id)
    assert invite_link.type == :personal
    assert invite_link.person_id == invitation.member_id
    assert invite_link.expires_at == valid_until

    assert {:error, :not_found} = InviteLinks.get_personal_invite_link_for_person(closed_member.id)
  end

  defp create_invitation_fixture do
    company = Operately.CompaniesFixtures.company_fixture(%{name: "Test Company"})
    admin = person_fixture(%{email: "admin@test.com", company_id: company.id})
    member = create_person(%{email: "member@test.com", company_id: company.id, has_open_invitation: true})

    {:ok, invitation} = create_invitation(%{member_id: member.id, admin_id: admin.id})

    Map.put(invitation, :member, member)
  end

  defp create_invitation(attrs) do
    id = Ecto.UUID.generate()
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    Repo.insert_all("invitations", [
      %{
        id: Ecto.UUID.dump!(id),
        admin_id: Ecto.UUID.dump!(attrs.admin_id),
        member_id: Ecto.UUID.dump!(attrs.member_id),
        inserted_at: now,
        updated_at: now
      }
    ])

    {:ok, %{
      id: id,
      admin_id: attrs.admin_id,
      member_id: attrs.member_id,
      inserted_at: now,
      updated_at: now
    }}
  end

  defp create_person(attrs) do
    person = person_fixture_with_account(attrs)
    set_has_open_invitation(person, attrs.has_open_invitation)

    person
  end

  defp set_has_open_invitation(person, open_invitation) do
    person_id = Ecto.UUID.dump!(person.id)

    from(p in "people", where: p.id == ^person_id)
    |> Operately.Repo.update_all(set: [has_open_invitation: open_invitation])
  end
end
