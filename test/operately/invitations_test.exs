defmodule Operately.InvitationsTest do
  use Operately.DataCase

  alias Operately.Invitations
  alias Operately.Invitations.Invitation
  alias Operately.Invitations.InvitationToken

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

    test "create_invitation/1 with valid data creates a invitation" do
      company = company_fixture(%{name: "Test Company"})
      admin = person_fixture(%{email: "admin@test.com", company_role: :admin, company_id: company.id})
      member = person_fixture(%{email: "member@test.com", company_role: :member, company_id: company.id})
      valid_attrs = %{
        member_id: member.id,
        admin_id: admin.id,
        admin_name: admin.full_name,
      }

      assert {:ok, %Invitation{} = invitation} = Invitations.create_invitation(valid_attrs)
      assert invitation.admin_name == admin.full_name
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

  describe "invitation_tokens" do
    @invalid_attrs %{invitation_id: nil}

    test "list_invitation_tokens/0 returns all invitation_tokens" do
      invitation_token = invitation_token_fixture()
      assert Invitations.list_invitation_tokens() == [invitation_token]
    end

    test "get_invitation_token!/1 returns the invitation_token with given id" do
      invitation_token = invitation_token_fixture()
      assert Invitations.get_invitation_token!(invitation_token.id) == invitation_token
    end

    test "create_invitation_token/1 with valid data creates a invitation_token" do
      invitation = invitation_fixture()

      assert {:ok, %InvitationToken{} = invitation_token} = Invitations.create_invitation_token(invitation.id)
      assert invitation_token.invitation_id == invitation.id
      assert byte_size(invitation_token.hashed_token) == 60
    end

    test "create_invitation_token/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Invitations.create_invitation_token(@invalid_attrs)
    end

    test "delete_invitation_token/1 deletes the invitation_token" do
      invitation_token = invitation_token_fixture()
      assert {:ok, %InvitationToken{}} = Invitations.delete_invitation_token(invitation_token)
      assert_raise Ecto.NoResultsError, fn -> Invitations.get_invitation_token!(invitation_token.id) end
    end
  end
end
