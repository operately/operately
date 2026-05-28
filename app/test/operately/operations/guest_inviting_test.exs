defmodule Operately.Operations.GuestInvitingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Billing
  alias Operately.Billing.EnforceLimits.LimitError
  alias Operately.Groups
  alias Operately.InviteLinks
  alias Operately.People
  alias Operately.People.Person
  alias Operately.Activities.Activity

  @email "guest@your-company.com"

  @guest_attrs %{
    :full_name => "Guest User",
    :email => @email,
    :title => "Advisor",
  }

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id})

    {:ok, company: company, admin: admin}
  end

  test "GuestInviting operation creates guest person", ctx do
    assert Repo.aggregate(Person, :count, :id) == 2

    {:ok, _} = Operately.Operations.GuestInviting.run(ctx.admin, ctx.company, @guest_attrs)

    person = People.get_person_by_email(ctx.company, @email)

    assert person.full_name == "Guest User"
    assert person.title == "Advisor"
    assert person.type == :guest

    account = People.get_account_by_email(@email)
    assert account
    assert is_nil(account.first_login_at)
  end

  test "GuestInviting blocks when the company is already at the member limit", ctx do
    company = enable_billing(ctx.company)
    fill_company_to_member_limit(company)

    initial_people_count = Repo.aggregate(Person, :count, :id)
    initial_account_count = Repo.aggregate(Operately.People.Account, :count, :id)
    initial_invite_link_count = Repo.aggregate(InviteLinks.InviteLink, :count, :id)
    initial_activity_count = Repo.aggregate(Activity, :count, :id)
    initial_notification_count = Repo.aggregate(Operately.Notifications.Notification, :count, :id)

    assert {:error, %LimitError{code: :member_count_limit_exceeded}} = Operately.Operations.GuestInviting.run(ctx.admin, company, @guest_attrs)

    assert Repo.aggregate(Person, :count, :id) == initial_people_count
    assert Repo.aggregate(Operately.People.Account, :count, :id) == initial_account_count
    assert Repo.aggregate(InviteLinks.InviteLink, :count, :id) == initial_invite_link_count
    assert Repo.aggregate(Activity, :count, :id) == initial_activity_count
    assert Repo.aggregate(Operately.Notifications.Notification, :count, :id) == initial_notification_count
    refute People.get_account_by_email(@email)
    refute People.get_person_by_email(company, @email)
  end

  test "GuestInviting does not block at the free-plan threshold when the company is on a premium plan", ctx do
    company = enable_billing(ctx.company)
    fill_company_to_member_limit(company)
    put_company_on_team_plan(company)

    assert {:ok, changes} = Operately.Operations.GuestInviting.run(ctx.admin, company, @guest_attrs)

    assert changes.person.email == @email
    assert Billing.active_member_count(company) == 21
    assert People.get_person_by_email(company, @email)
  end

  test "GuestInviting operation creates personal access group but not company membership", ctx do
    {:ok, _} = Operately.Operations.GuestInviting.run(ctx.admin, ctx.company, @guest_attrs)

    person = People.get_person_by_email(ctx.company, @email)
    person_group = Access.get_group!(person_id: person.id)

    assert Access.get_group_membership(group_id: person_group.id, person_id: person.id)

    company_group = Access.get_group!(company_id: ctx.company.id, tag: :standard)

    refute Access.get_group_membership(group_id: company_group.id, person_id: person.id)
  end

  test "GuestInviting operation creates binding to company context with view access", ctx do
    {:ok, _} = Operately.Operations.GuestInviting.run(ctx.admin, ctx.company, @guest_attrs)

    person = People.get_person_by_email(ctx.company, @email)
    person_group = Access.get_group!(person_id: person.id)
    company_context = Access.get_context!(company_id: ctx.company.id)

    binding = Access.get_binding(group_id: person_group.id, context_id: company_context.id)

    assert binding
    assert binding.access_level == Access.Binding.minimal_access()
  end

  test "GuestInviting operation does not create binding to company space context", ctx do
    {:ok, _} = Operately.Operations.GuestInviting.run(ctx.admin, ctx.company, @guest_attrs)

    person = People.get_person_by_email(ctx.company, @email)
    person_group = Access.get_group!(person_id: person.id)
    company_space_context = Access.get_context!(group_id: ctx.company.company_space_id)

    refute Access.get_binding(group_id: person_group.id, context_id: company_space_context.id)
  end

  test "GuestInviting operation does not add guest to company space", ctx do
    company_space = Groups.get_group!(ctx.company.company_space_id)
    initial_count = length(Groups.list_members(company_space))

    {:ok, _} = Operately.Operations.GuestInviting.run(ctx.admin, ctx.company, @guest_attrs)

    assert length(Groups.list_members(company_space)) == initial_count
  end

  test "GuestInviting operation creates invite link when account unused", ctx do
    {:ok, changes} = Operately.Operations.GuestInviting.run(ctx.admin, ctx.company, @guest_attrs)

    person = People.get_person_by_email(ctx.company, @email)

    assert {:ok, invite_link} = InviteLinks.get_personal_invite_link_for_person(person.id)
    assert invite_link.person_id == person.id
    assert changes[:invite_link].id == invite_link.id
  end

  test "GuestInviting operation skips invite link when account already used", ctx do
    account = account_fixture(%{email: "used-guest@your-company.com"})
    {:ok, _} = People.mark_account_first_login(account)

    attrs = Map.put(@guest_attrs, :email, account.email)
    {:ok, changes} = Operately.Operations.GuestInviting.run(ctx.admin, ctx.company, attrs)

    assert is_nil(changes[:invite_link])

    person = People.get_person_by_email(ctx.company, account.email)
    assert {:error, :not_found} = InviteLinks.get_personal_invite_link_for_person(person.id)
    assert changes[:person].id == person.id
  end

  test "GuestInviting operation creates activity and notifications", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      {:ok, _changes} = Operately.Operations.GuestInviting.run(ctx.admin, ctx.company, @guest_attrs)
    end)

    person = People.get_person_by_email(ctx.company, @email)

    activity =
      from(a in Activity, where: a.action == "guest_invited" and a.content["person_id"] == ^person.id)
      |> Repo.one()

    assert activity.content["company_id"] == ctx.company.id
    assert activity.content["person_id"] == person.id
    assert activity.content["invite_link_id"]

    assert notifications_count() == 0

    perform_job(activity.id)

    [notification] = fetch_notifications(activity.id)

    assert notification.person_id == person.id
    assert notification.should_send_email
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
          full_name: "Limit Guest #{index}",
          email: "limit-guest-#{index}@example.com"
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
