defmodule OperatelyEmail.GuestInvitedEmailTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Swoosh.TestAssertions

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.People
  alias OperatelyEmail.Emails.GuestInvitedEmail
  alias OperatelyWeb.Paths

  @guest_attrs %{
    :full_name => "Guest User",
    :email => "guest@your-company.com",
    :title => "Advisor",
  }

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, admin: admin}
  end

  test "includes invite link when account unused", ctx do
    invite_link =
      Oban.Testing.with_testing_mode(:manual, fn ->
        {:ok, changes} = Operately.Operations.GuestInviting.run(ctx.admin, @guest_attrs)
        changes.invite_link
      end)

    person = People.get_person_by_email(ctx.company, @guest_attrs[:email])

    activity =
      from(a in Activity, where: a.action == "guest_invited" and a.content["person_id"] == ^person.id)
      |> Repo.one()

    GuestInvitedEmail.send(person, activity)

    invite_url = Paths.join_path(invite_link.token) |> Paths.to_url()

    assert_email_sent(fn email ->
      assert email.html_body =~ invite_url
      assert email.text_body =~ invite_url
      true
    end)
  end

  test "omits invite link when account already used", ctx do
    account = account_fixture(%{email: "used-guest@your-company.com"})
    {:ok, _} = People.mark_account_first_login(account)

    attrs = Map.put(@guest_attrs, :email, account.email)
    Oban.Testing.with_testing_mode(:manual, fn ->
      {:ok, _} = Operately.Operations.GuestInviting.run(ctx.admin, attrs)
    end)

    person = People.get_person_by_email(ctx.company, account.email)

    activity =
      from(a in Activity, where: a.action == "guest_invited" and a.content["person_id"] == ^person.id)
      |> Repo.one()

    GuestInvitedEmail.send(person, activity)

    login_url = Paths.login_path() |> Paths.to_url()

    assert_email_sent(fn email ->
      refute String.contains?(email.html_body, "/join?token=")
      refute String.contains?(email.text_body, "/join?token=")
      assert email.text_body =~ "Log in to Operately"
      assert email.text_body =~ login_url
      true
    end)
  end
end
