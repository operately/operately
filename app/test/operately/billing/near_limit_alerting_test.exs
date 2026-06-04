defmodule Operately.Billing.NearLimitAlertingTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Billing
  alias Operately.Billing.EnforceLimits
  alias Operately.Billing.NearLimitAlertEmailWorker
  alias Operately.Billing.NearLimitAlerting
  alias Operately.Billing.Plans
  alias Operately.People.Person
  alias Operately.Repo

  setup do
    company = company_fixture()

    {:ok, company: company}
  end

  test "member-limit 90-percent crossing enqueues one job only once per company", ctx do
    company = enable_billing(ctx.company)
    threshold = EnforceLimits.near_limit_threshold(Plans.member_limit(:free))

    fill_company_to_member_count(company, threshold)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert :ok = NearLimitAlerting.maybe_enqueue_near_limit_warning_email(company, :member_count, threshold - 1)
      assert length(all_enqueued(worker: NearLimitAlertEmailWorker)) == 1

      assert :ok = NearLimitAlerting.maybe_enqueue_near_limit_warning_email(company, :member_count, threshold - 1)
      assert length(all_enqueued(worker: NearLimitAlertEmailWorker)) == 1
    end)
  end

  test "does not enqueue near-limit emails for paid plans", ctx do
    company = enable_billing(ctx.company)
    threshold = EnforceLimits.near_limit_threshold(Plans.member_limit(:free))

    fill_company_to_member_count(company, threshold)
    put_company_on_team_plan(company)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert :ok = NearLimitAlerting.maybe_enqueue_near_limit_warning_email(company, :member_count, threshold - 1)
      refute_enqueued worker: NearLimitAlertEmailWorker
    end)
  end

  test "does not enqueue near-limit emails when billing is disabled", ctx do
    threshold = EnforceLimits.near_limit_threshold(Plans.member_limit(:free))
    fill_company_to_member_count(ctx.company, threshold)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert :ok = NearLimitAlerting.maybe_enqueue_near_limit_warning_email(ctx.company, :member_count, threshold - 1)
      refute_enqueued worker: NearLimitAlertEmailWorker
    end)
  end

  test "storage-limit 90-percent crossing enqueues one job only once per company", ctx do
    company = enable_billing(ctx.company)
    limit = Plans.storage_limit_bytes(:free)
    threshold = EnforceLimits.near_limit_threshold(limit)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert :ok =
               NearLimitAlerting.maybe_enqueue_near_limit_warning_email(company, :storage_bytes, threshold - 1,
                 current_usage: threshold
               )

      assert length(all_enqueued(worker: NearLimitAlertEmailWorker)) == 1

      assert :ok =
               NearLimitAlerting.maybe_enqueue_near_limit_warning_email(company, :storage_bytes, threshold - 1,
                 current_usage: threshold
               )

      assert length(all_enqueued(worker: NearLimitAlertEmailWorker)) == 1
    end)
  end

  defp enable_billing(company) do
    previous_value = Application.get_env(:operately, :billing_enabled)
    Application.put_env(:operately, :billing_enabled, true)

    on_exit(fn ->
      restore_billing_enabled(previous_value)
    end)

    {:ok, company} = Operately.Companies.enable_experimental_feature(company, "billing")
    company
  end

  defp restore_billing_enabled(nil), do: Application.delete_env(:operately, :billing_enabled)
  defp restore_billing_enabled(value), do: Application.put_env(:operately, :billing_enabled, value)

  defp fill_company_to_member_count(company, target_count) do
    current_count = Billing.active_member_count(company)

    if current_count < target_count do
      Enum.each((current_count + 1)..target_count, fn index ->
        account = account_fixture(%{email: "near-limit-member-#{index}@example.com", full_name: "Near Limit Member #{index}"})

        %Person{}
        |> Person.changeset(%{
          company_id: company.id,
          account_id: account.id,
          full_name: "Near Limit Member #{index}",
          email: account.email,
          suspended: false
        })
        |> Repo.insert!()
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
