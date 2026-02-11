defmodule OperatelyEmail.CompanyMemberConvertedToGuestEmailTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Swoosh.TestAssertions

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias OperatelyEmail.Emails.CompanyMemberConvertedToGuestEmail
  alias OperatelyWeb.Paths

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id, has_open_invitation: false})
    member = person_fixture_with_account(%{company_id: company.id, has_open_invitation: false})

    {:ok, company: company, admin: admin, member: member}
  end

  test "sends email to converted outside collaborator", ctx do
    {:ok, _} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.admin, ctx.member)

    activity =
      from(a in Activity, where: a.action == "company_member_converted_to_guest" and a.content["person_id"] == ^ctx.member.id)
      |> Repo.one()

    CompanyMemberConvertedToGuestEmail.send(ctx.member, activity)

    login_url = Paths.login_path() |> Paths.to_url()

    assert_email_sent(fn email ->
      [{_name, email_addr}] = email.to
      assert email_addr == ctx.member.email
      assert email.html_body =~ login_url
      assert email.text_body =~ login_url
      assert email.text_body =~ "outside collaborator"
      true
    end)
  end

  test "email includes company name", ctx do
    {:ok, _} = Operately.Operations.CompanyMemberConvertingToGuest.run(ctx.admin, ctx.member)

    activity =
      from(a in Activity, where: a.action == "company_member_converted_to_guest" and a.content["person_id"] == ^ctx.member.id)
      |> Repo.one()

    CompanyMemberConvertedToGuestEmail.send(ctx.member, activity)

    assert_email_sent(fn email ->
      assert email.html_body =~ ctx.company.name
      assert email.text_body =~ ctx.company.name
      true
    end)
  end
end
