defmodule OperatelyEmail.CompanyMemberAddedEmailTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Swoosh.TestAssertions

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias OperatelyEmail.Emails.CompanyMemberAddedEmail
  alias OperatelyWeb.Paths

  @member_attrs %{
    :full_name => "John Doe",
    :email => "john@your-company.com",
    :title => "Developer",
  }

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, admin: admin}
  end

  describe "with invite link" do
    test "sends email to newly added company member", ctx do
      {:ok, _invite_link} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, @member_attrs)

      person = Operately.People.get_person_by_email(ctx.company, @member_attrs[:email])

      activity =
        from(a in Activity, where: a.action == "company_member_added" and a.content["person_id"] == ^person.id)
        |> Repo.one()

      CompanyMemberAddedEmail.send(person, activity)

      assert_email_sent(fn email ->
        [{_name, email_addr}] = email.to
        assert email_addr == person.email
        assert email.html_body =~ "/join?token="
        assert email.text_body =~ "/join?token="
        assert email.text_body =~ "company member"
        true
      end)
    end

    test "email includes company name", ctx do
      {:ok, _invite_link} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, @member_attrs)

      person = Operately.People.get_person_by_email(ctx.company, @member_attrs[:email])

      activity =
        from(a in Activity, where: a.action == "company_member_added" and a.content["person_id"] == ^person.id)
        |> Repo.one()

      CompanyMemberAddedEmail.send(person, activity)

      assert_email_sent(fn email ->
        assert email.html_body =~ ctx.company.name
        assert email.text_body =~ ctx.company.name
        true
      end)
    end

    test "email includes author name with invite message", ctx do
      {:ok, _invite_link} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, @member_attrs)

      person = Operately.People.get_person_by_email(ctx.company, @member_attrs[:email])

      activity =
        from(a in Activity, where: a.action == "company_member_added" and a.content["person_id"] == ^person.id)
        |> Repo.one()

      CompanyMemberAddedEmail.send(person, activity)

      assert_email_sent(fn email ->
        assert email.html_body =~ "invited you to join #{ctx.company.name}"
        assert email.text_body =~ "invited you to join #{ctx.company.name}"
        true
      end)
    end
  end

  describe "without invite link" do
    test "sends email with login link when no invite link exists", ctx do
      person = person_fixture(%{company_id: ctx.company.id, email: @member_attrs[:email]})

      activity =
        Activity.changeset(%Activity{}, %{
          action: "company_member_added",
          company_id: ctx.company.id,
          author_id: ctx.admin.id,
          content: %{"person_id" => person.id}
        })
        |> Repo.insert!()

      CompanyMemberAddedEmail.send(person, activity)

      login_url = Paths.login_path() |> Paths.to_url()

      assert_email_sent(fn email ->
        [{_name, email_addr}] = email.to
        assert email_addr == person.email
        assert email.html_body =~ login_url
        assert email.text_body =~ login_url
        assert email.text_body =~ "company member"
        true
      end)
    end

    test "email includes author name with added message when no invite link", ctx do
      person = person_fixture(%{company_id: ctx.company.id, email: @member_attrs[:email]})

      activity =
        Activity.changeset(%Activity{}, %{
          action: "company_member_added",
          company_id: ctx.company.id,
          author_id: ctx.admin.id,
          content: %{"person_id" => person.id}
        })
        |> Repo.insert!()

      CompanyMemberAddedEmail.send(person, activity)

      assert_email_sent(fn email ->
        assert email.html_body =~ "added you as a company member"
        assert email.text_body =~ "added you as a company member"
        true
      end)
    end
  end
end
