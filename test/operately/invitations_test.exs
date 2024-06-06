defmodule Operately.InvitationsTest do
  use Operately.DataCase

  alias Operately.Repo
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

    test "get_invitation_by_token!/1 returns the invitation" do
      invitation = invitation_fixture()
      token = invitation_token_fixture_unhashed(invitation.id)

      queried_invitation = Invitations.get_invitation_by_token(token)

      assert queried_invitation == invitation
    end

    test "get_invitation_by_member/1 returns the invitation" do
      company = company_fixture(%{name: "Test Company"})
      admin = person_fixture_with_account(%{company_id: company.id, company_role: :admin})
      member = person_fixture_with_account(%{company_id: company.id})

      invitation = invitation_fixture(%{member_id: member.id, admin_id: admin.id})
      invitation = Repo.preload(invitation, [:member])

      assert invitation == Invitations.get_invitation_by_member(member.id)
      assert invitation == Invitations.get_invitation_by_member(member)
    end

    test "create_invitation/1 with valid data creates a invitation" do
      company = company_fixture(%{name: "Test Company"})
      admin = person_fixture(%{email: "admin@test.com", company_role: :admin, company_id: company.id})
      member = person_fixture(%{email: "member@test.com", company_role: :member, company_id: company.id})
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

  describe "invitation_tokens" do
    test "list_invitation_tokens/0 returns all invitation_tokens" do
      invitation_token = invitation_token_fixture()
      assert Invitations.list_invitation_tokens() == [invitation_token]
    end

    test "get_invitation_token!/1 returns the invitation_token with given id" do
      invitation_token = invitation_token_fixture()
      assert Invitations.get_invitation_token!(invitation_token.id) == invitation_token
    end

    test "get_invitation_token_by_invitation!/1 returns the invitation_token with given id" do
      invitation = invitation_fixture()
      invitation_token = invitation_token_fixture(invitation.id, [])

      queried_token = Invitations.get_invitation_token_by_invitation(invitation.id)

      assert queried_token.id == invitation_token.id
    end

    test "create_invitation_token!/1 with valid data creates a invitation_token" do
      invitation = invitation_fixture()
      token = InvitationToken.build_token()

      assert {:ok, %InvitationToken{} = invitation_token} = Invitations.create_invitation_token!(%{
        invitation_id: invitation.id,
        token: token,
      })
      assert invitation_token.invitation_id == invitation.id
    end

    test "create_invitation_token!/1 deletes previous invitation_token" do
      invitation = invitation_fixture()
      token = InvitationToken.build_token()

      assert {:ok, %InvitationToken{} = first_token} = Invitations.create_invitation_token!(%{
        invitation_id: invitation.id,
        token: token,
      })
      queried_token = Invitations.get_invitation_token_by_invitation(invitation.id)
      assert queried_token.id == first_token.id

      assert {:ok, %InvitationToken{} = second_token} = Invitations.create_invitation_token!(%{
        invitation_id: invitation.id,
        token: token,
      })
      queried_token = Invitations.get_invitation_token_by_invitation(invitation.id)
      assert queried_token.id == second_token.id

      assert 1 == Repo.aggregate(InvitationToken, :count, :id)
    end

    test "delete_invitation_token/1 deletes the invitation_token" do
      invitation_token = invitation_token_fixture()
      assert {:ok, %InvitationToken{}} = Invitations.delete_invitation_token(invitation_token)
      assert_raise Ecto.NoResultsError, fn -> Invitations.get_invitation_token!(invitation_token.id) end
    end
  end

  describe "invalid invitation_tokens" do
    test "tokens already expired" do
      invitation = invitation_fixture()
      token = InvitationToken.build_token()

      Operately.Invitations.create_invitation_token!(%{
        invitation_id: invitation.id,
        token: token,
      }, minutes: -1)

      assert nil == Invitations.get_invitation_by_token(token)
    end

    test "valid_token_time?/2 returns correct value" do
      token = invitation_token_fixture()

      valid_time = DateTime.add(DateTime.utc_now(), -100, :minute)
      invalid_time = DateTime.add(DateTime.utc_now(), 100, :minute)

      assert InvitationToken.valid_token_time?(token, valid_time)
      assert !InvitationToken.valid_token_time?(token, invalid_time)
    end
  end
end
