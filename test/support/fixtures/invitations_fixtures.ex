defmodule Operately.InvitationsFixtures do
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Invitations
  alias Operately.Invitations.InvitationToken

  @doc """
  Generate an invitation.
  """
  def invitation_fixture() do
    company = company_fixture(%{name: "Test Company"})
    admin = person_fixture(%{
      email: "admin@test.com",
      company_role: :admin,
      company_id: company.id,
    })
    member = person_fixture_with_account(%{
      email: "member@test.com",
      company_role: :member,
      company_id: company.id,
    })

    {:ok, invitation} = Invitations.create_invitation(%{
      member_id: member.id,
      admin_id: admin.id,
    })

    invitation
  end

  def invitation_fixture(attrs) do
    {:ok, invitation} = Invitations.create_invitation(attrs)

    invitation
  end

  @doc """
  Generate an invitation_token.
  """
  def invitation_token_fixture(opts \\ []) do
    invitation = invitation_fixture()

    invitation_token_fixture(invitation.id, opts)
  end

  def invitation_token_fixture(invitation_id, opts) do
    token = InvitationToken.build_token()

    {:ok, invitation_token} = Invitations.create_invitation_token!(%{
      invitation_id: invitation_id,
      token: token,
    }, opts)

    invitation_token
  end

  def invitation_token_fixture_unhashed() do
    invitation = invitation_fixture()

    invitation_token_fixture_unhashed(invitation.id)
  end

  def invitation_token_fixture_unhashed(invitation_id) do
    token = InvitationToken.build_token()

    Invitations.create_invitation_token!(%{
      invitation_id: invitation_id,
      token: token,
    })

    token
  end
end
