defmodule Operately.Operations.CompanyMemberRestoringTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Activities.Activity
  alias Operately.Billing
  alias Operately.Billing.EnforceLimits.LimitError
  alias Operately.Repo

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id})
    suspended_person = person_fixture_with_account(%{company_id: company.id})

    {:ok, suspended_person} =
      Operately.People.update_person(suspended_person, %{
        suspended: true,
        suspended_at: DateTime.utc_now() |> DateTime.truncate(:second)
      })

    {:ok, company: company, admin: admin, suspended_person: suspended_person}
  end

  test "CompanyMemberRestoring restores a suspended person", ctx do
    assert {:ok, restored_person} = Operately.Operations.CompanyMemberRestoring.run(ctx.admin, ctx.company, ctx.suspended_person)

    assert restored_person.suspended == false
    assert restored_person.suspended_at == nil
  end

  test "CompanyMemberRestoring blocks when the company is already at the member limit", ctx do
    company = enable_billing(ctx.company)
    fill_company_to_member_limit(company)

    initial_activity_count =
      from(a in Activity, where: a.action == "company_member_restoring")
      |> Repo.aggregate(:count, :id)

    assert {:error, %LimitError{code: :member_count_limit_exceeded}} = Operately.Operations.CompanyMemberRestoring.run(ctx.admin, company, ctx.suspended_person)

    suspended_person = Repo.reload(ctx.suspended_person)

    assert suspended_person.suspended == true
    assert suspended_person.suspended_at != nil

    activity_count =
      from(a in Activity, where: a.action == "company_member_restoring")
      |> Repo.aggregate(:count, :id)

    assert activity_count == initial_activity_count
  end

  test "CompanyMemberRestoring does not block at the free-plan threshold when the company is on a premium plan", ctx do
    company = enable_billing(ctx.company)
    fill_company_to_member_limit(company)
    put_company_on_team_plan(company)

    assert {:ok, restored_person} = Operately.Operations.CompanyMemberRestoring.run(ctx.admin, company, ctx.suspended_person)

    assert restored_person.suspended == false
    assert restored_person.suspended_at == nil
    assert Billing.active_member_count(company) == 21
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
          full_name: "Restore Limit Member #{index}",
          email: "restore-limit-member-#{index}@example.com"
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
