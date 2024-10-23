defmodule Operately.Operations.PasswordFirstTimeChangingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.InvitationsFixtures

  alias Operately.People.Account
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    inviter = person_fixture_with_account(%{company_id: company.id})
    member = person_fixture_with_account(%{company_id: company.id, has_open_invitation: true})
    invitation = invitation_fixture(%{member_id: member.id, admin_id: inviter.id})

    attrs = %{
      password: "AaBb12345@#cC",
      password_confirmation: "AaBb12345@#cC",
    }

    {:ok, company: company, member: member, invitation: invitation, attrs: attrs}
  end

  test "PasswordFirstTimeChanging operation changes password", ctx do
    member_account = Repo.preload(ctx.member, :account).account
    refute Account.valid_password?(member_account, ctx.attrs.password)

    {:ok, _} = Operately.Operations.PasswordFirstTimeChanging.run(ctx.attrs, ctx.invitation)

    member_account = Repo.reload(member_account)
    assert Account.valid_password?(member_account, ctx.attrs.password)
  end

  test "PasswordFirstTimeChanging operation sets has_open_invitation to false", ctx do
    assert ctx.member.has_open_invitation

    {:ok, _} = Operately.Operations.PasswordFirstTimeChanging.run(ctx.attrs, ctx.invitation)

    member = Repo.reload(ctx.member)
    refute member.has_open_invitation
  end

  test "PasswordFirstTimeChanging operation creates activity", ctx do
    {:ok, _} = Operately.Operations.PasswordFirstTimeChanging.run(ctx.attrs, ctx.invitation)

    activity = from(a in Activity, where: a.action == "password_first_time_changed" and a.content["member_email"] == ^ctx.member.email) |> Repo.one()

    assert activity.content["company_id"] == ctx.company.id
    assert activity.content["invitatition_id"] == ctx.invitation.id
  end
end
