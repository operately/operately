defmodule Operately.InvitationsTest do
  use Operately.DataCase

  alias Operately.Repo
  alias Operately.Invitations
  alias Operately.Invitations.Invitation

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.InvitationsFixtures


  describe "invitations" do
    @invalid_attrs %{}

    test "list_invitations/0 returns all invitations" do
      invitation = invitation_fixture()
      assert Invitations.list_invitations() == [invitation]
    end

    test "get_invitation!/1 returns the invitation with given id" do
      invitation = invitation_fixture()
      assert Invitations.get_invitation!(invitation.id) == invitation
    end

    test "get_invitation_by_member/1 returns the invitation" do
      company = company_fixture(%{name: "Test Company"})
      admin = person_fixture_with_account(%{company_id: company.id})
      member = person_fixture_with_account(%{company_id: company.id})

      invitation = invitation_fixture(%{member_id: member.id, admin_id: admin.id})
      invitation = Repo.preload(invitation, [:member])

      assert invitation == Invitations.get_invitation_by_member(member.id)
      assert invitation == Invitations.get_invitation_by_member(member)
    end

    test "create_invitation/1 with valid data creates a invitation" do
      company = company_fixture(%{name: "Test Company"})
      admin = person_fixture(%{email: "admin@test.com", company_id: company.id})
      member = person_fixture(%{email: "member@test.com", company_id: company.id})
      valid_attrs = %{
        member_id: member.id,
        admin_id: admin.id,
      }

      assert {:ok, %Invitation{}} = Invitations.create_invitation(valid_attrs)
    end

    test "create_invitation/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Invitations.create_invitation(@invalid_attrs)
    end

    test "delete_invitation/1 deletes the invitation" do
      invitation = invitation_fixture()
      assert {:ok, %Invitation{}} = Invitations.delete_invitation(invitation)
      assert_raise Ecto.NoResultsError, fn -> Invitations.get_invitation!(invitation.id) end
    end
  end
end
