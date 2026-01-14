defmodule Operately.Operations.PasswordFirstTimeChangingTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.InviteLinksFixtures

  alias Operately.People.Account
  alias Operately.Activities.Activity

  setup do
    company = company_fixture()
    inviter = person_fixture_with_account(%{company_id: company.id})
    member = person_fixture_with_account(%{company_id: company.id, has_open_invitation: true})
    invite_link = personal_invite_link_fixture(%{company_id: company.id, author_id: inviter.id, person_id: member.id})

    attrs = %{
      password: "AaBb12345@#cC",
      password_confirmation: "AaBb12345@#cC",
    }

    {:ok, company: company, member: member, invite_link: invite_link, attrs: attrs}
  end

  test "PasswordFirstTimeChanging operation changes password", ctx do
    member_account = Repo.preload(ctx.member, :account).account
    refute Account.valid_password?(member_account, ctx.attrs.password)

    {:ok, _} = Operately.Operations.PasswordFirstTimeChanging.run(ctx.attrs, ctx.invite_link)

    member_account = Repo.reload(member_account)
    assert Account.valid_password?(member_account, ctx.attrs.password)
  end

  test "PasswordFirstTimeChanging operation sets has_open_invitation to false", ctx do
    assert ctx.member.has_open_invitation

    {:ok, _} = Operately.Operations.PasswordFirstTimeChanging.run(ctx.attrs, ctx.invite_link)

    member = Repo.reload(ctx.member)
    refute member.has_open_invitation
  end

  test "PasswordFirstTimeChanging operation creates activity", ctx do
    {:ok, _} = Operately.Operations.PasswordFirstTimeChanging.run(ctx.attrs, ctx.invite_link)

    activity = from(a in Activity, where: a.action == "password_first_time_changed" and a.content["member_email"] == ^ctx.member.email) |> Repo.one()

    assert activity.content["company_id"] == ctx.company.id
    assert activity.content["invite_link_id"] == ctx.invite_link.id
  end
end
