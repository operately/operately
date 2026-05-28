defmodule Operately.Operations.CompanyMemberAddingTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Billing
  alias Operately.Billing.EnforceLimits.LimitError
  alias Operately.People
  alias Operately.People.Person
  alias Operately.Groups
  alias Operately.Groups.Member
  alias Operately.InviteLinks
  alias Operately.Activities.Activity
  alias Operately.Companies.Company

  @email "john@your-company.com"

  @member_attrs %{
    :full_name => "John Doe",
    :email => @email,
    :title => "Developer",
  }

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, admin: admin}
  end

  test "CompanyMemberAdding operation creates person", ctx do
    assert Repo.aggregate(Person, :count, :id) == 2 # company creator + company admin

    {:ok, _} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, ctx.company, @member_attrs)

    assert Repo.aggregate(Person, :count, :id) == 3 # company creator + company admin + new member
    assert People.get_account_by_email(@email)

    person = People.get_person_by_email(ctx.company, @email)

    assert person.full_name == "John Doe"
    assert person.title == "Developer"
    person = Repo.preload(person, :account)
    assert is_nil(person.account.first_login_at)
  end

  test "CompanyMemberAdding blocks when the company is already at the member limit", ctx do
    company = enable_billing(ctx.company)
    fill_company_to_member_limit(company)

    initial_people_count = Repo.aggregate(Person, :count, :id)
    initial_account_count = Repo.aggregate(Operately.People.Account, :count, :id)
    initial_invite_link_count = Repo.aggregate(InviteLinks.InviteLink, :count, :id)
    initial_activity_count = Repo.aggregate(Activity, :count, :id)
    initial_notification_count = Repo.aggregate(Operately.Notifications.Notification, :count, :id)

    assert {:error, %LimitError{code: :member_count_limit_exceeded}} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, company, @member_attrs)

    assert Repo.aggregate(Person, :count, :id) == initial_people_count
    assert Repo.aggregate(Operately.People.Account, :count, :id) == initial_account_count
    assert Repo.aggregate(InviteLinks.InviteLink, :count, :id) == initial_invite_link_count
    assert Repo.aggregate(Activity, :count, :id) == initial_activity_count
    assert Repo.aggregate(Operately.Notifications.Notification, :count, :id) == initial_notification_count
    refute People.get_account_by_email(@email)
    refute People.get_person_by_email(company, @email)
  end

  test "CompanyMemberAdding does not block at the free-plan threshold when the company is on a premium plan", ctx do
    company = enable_billing(ctx.company)
    fill_company_to_member_limit(company)
    put_company_on_team_plan(company)

    assert {:ok, changes} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, company, @member_attrs)

    assert changes.person.email == @email
    assert Billing.active_member_count(company) == 21
    assert People.get_person_by_email(company, @email)
  end

  test "CompanyMemberAdding operation leaves first_login_at nil for new account", ctx do
    email = "new-member@your-company.com"
    attrs = Map.put(@member_attrs, :email, email)

    refute People.get_account_by_email(email)

    {:ok, _} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, ctx.company, attrs)

    account = People.get_account_by_email(email)
    assert account
    assert is_nil(account.first_login_at)
  end

  test "CompanyMemberAdding operation leaves first_login_at nil when account exists without first login", ctx do
    email = "existing-no-login@your-company.com"
    account = account_fixture(%{email: email})

    assert People.get_account_by_email(email)

    attrs = Map.put(@member_attrs, :email, email)
    {:ok, _} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, ctx.company, attrs)

    account = Repo.get!(Operately.People.Account, account.id)
    assert is_nil(account.first_login_at)
  end

  test "CompanyMemberAdding operation keeps first_login_at when account already logged in", ctx do
    account = account_fixture(%{email: "existing-logged-in@your-company.com"})

    {:ok, account} = People.mark_account_first_login(account)
    first_login_at = account.first_login_at

    attrs = Map.put(@member_attrs, :email, account.email)
    {:ok, _} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, ctx.company, attrs)

    account = Repo.get!(Operately.People.Account, account.id)
    assert account.first_login_at == first_login_at
  end

  test "CompanyMemberAdding operation creates members's access group and membership", ctx do
    Operately.Operations.CompanyMemberAdding.run(ctx.admin, ctx.company, @member_attrs)

    person = People.get_person_by_email(ctx.company, @email)
    group = Access.get_group!(person_id: person.id)

    assert Access.get_group_membership(group_id: group.id, person_id: person.id)

    company_group = Access.get_group!(company_id: ctx.company.id, tag: :standard)

    assert Access.get_group_membership(group_id: company_group.id, person_id: person.id)
  end

  test "CompanyMemberAdding operation creates invite link for person", ctx do
    {:ok, changes} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, ctx.company, @member_attrs)

    person = People.get_person_by_email(ctx.company, @email)

    assert {:ok, invite_link} = InviteLinks.get_personal_invite_link_for_person(person.id)
    assert invite_link.person_id == person.id
    assert changes[:invite_link].id == invite_link.id
  end

  test "CompanyMemberAdding operation creates company space member", ctx do
    company_space = Groups.get_group!(ctx.company.company_space_id)

    initial_member_count = length(Groups.list_members(company_space))

    {:ok, _} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, ctx.company, @member_attrs)

    assert length(Groups.list_members(company_space)) == initial_member_count + 1
  end

  test "CompanyMemberAdding operation skips company space steps when the space is missing", ctx do
    company_space_id = ctx.company.company_space_id

    assert company_space_id

    {:ok, _} =
      ctx.company
      |> Company.changeset(%{company_space_id: nil})
      |> Repo.update()

    {:ok, changes} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, ctx.company, @member_attrs)
    assert changes[:invite_link]

    person = People.get_person_by_email(ctx.company, @email)

    refute Repo.get_by(Member, group_id: company_space_id, person_id: person.id)

    if context = Access.get_context(group_id: company_space_id) do
      if person_group = Access.get_group(person_id: person.id) do
        refute Access.get_binding(context_id: context.id, group_id: person_group.id)
      end
    end
  end

  test "CompanyMemberAdding operation creates activity", ctx do
    {:ok, changes} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, ctx.company, @member_attrs)

    activity = from(a in Activity, where: a.action == "company_member_added" and a.content["company_id"] == ^ctx.company.id) |> Repo.one()

    assert activity.content["invite_link_id"] == changes[:invite_link].id
    assert activity.content["name"] == "John Doe"
    assert activity.content["email"] == @email
    assert activity.content["title"] == "Developer"
  end

  test "CompanyMemberAdding operation creates notification for new member", ctx do
    {:ok, _changes} = Operately.Operations.CompanyMemberAdding.run(ctx.admin, ctx.company, @member_attrs)

    person = People.get_person_by_email(ctx.company, @email)
    activity = from(a in Activity, where: a.action == "company_member_added" and a.content["email"] == ^person.email) |> Repo.one()

    notification = from(n in Operately.Notifications.Notification, where: n.activity_id == ^activity.id) |> Repo.one()

    assert notification
    assert notification.person_id == person.id
    assert notification.should_send_email == true
  end

  defp enable_billing(company) do
    Application.put_env(:operately, :billing_enabled, true)
    on_exit(fn -> Application.delete_env(:operately, :billing_enabled) end)

    {:ok, company} = Operately.Companies.enable_experimental_feature(company, "billing")
    company
  end

  defp fill_company_to_member_limit(company) do
    needed_people = max(20 - Billing.active_member_count(company), 0)

    if needed_people > 0 do
      Enum.each(1..needed_people, fn index ->
        person_fixture_with_account(%{
          company_id: company.id,
          full_name: "Limit Member #{index}",
          email: "limit-member-#{index}@example.com"
        })
      end)
    end
  end

  defp put_company_on_team_plan(company) do
    {:ok, _account} =
      Billing.sync_billing_account(company, %{
        provider: "polar",
        plan_key: :team,
        billing_interval: :monthly,
        status: :active
      })
  end
end
