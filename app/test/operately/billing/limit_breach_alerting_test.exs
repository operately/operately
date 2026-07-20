defmodule Operately.Billing.LimitBreachAlertingTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  import Ecto.Query, only: [from: 2]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures

  alias Operately.Billing
  alias Operately.Billing.LimitBreachAlertEmailWorker
  alias Operately.Billing.LimitBreachAlerting
  alias Operately.People.Person
  alias Operately.Repo

  setup do
    company = company_fixture()

    {:ok, company: company}
  end

  test "member-limit threshold crossing enqueues one job", ctx do
    company = enable_billing(ctx.company)
    fill_company_to_member_count(company, 19)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert :ok = LimitBreachAlerting.maybe_enqueue_limit_reached_email(company, :member_count, 18)
      refute_enqueued worker: LimitBreachAlertEmailWorker

      fill_company_to_member_count(company, 20)

      assert :ok = LimitBreachAlerting.maybe_enqueue_limit_reached_email(company, :member_count, 19)
      assert length(all_enqueued(worker: LimitBreachAlertEmailWorker)) == 1

      assert :ok = LimitBreachAlerting.maybe_enqueue_limit_reached_email(company, :member_count, 20)
      assert length(all_enqueued(worker: LimitBreachAlertEmailWorker)) == 1
    end)
  end

  test "member-limit can enqueue again after dropping below the threshold", ctx do
    company = enable_billing(ctx.company)
    fill_company_to_member_count(company, 20)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert :ok = LimitBreachAlerting.maybe_enqueue_limit_reached_email(company, :member_count, 19)
      assert length(all_enqueued(worker: LimitBreachAlertEmailWorker)) == 1

      person_to_suspend =
        Repo.one!(
          from p in Person,
            where: p.company_id == ^company.id and p.suspended == false and is_nil(p.suspended_at),
            order_by: [desc: p.inserted_at],
            limit: 1
        )

      person_to_suspend
      |> Person.changeset(%{
        suspended: true,
        suspended_at: DateTime.utc_now() |> DateTime.truncate(:second)
      })
      |> Repo.update!()

      person_to_suspend
      |> Repo.reload()
      |> Person.changeset(%{suspended: false, suspended_at: nil})
      |> Repo.update!()

      assert :ok = LimitBreachAlerting.maybe_enqueue_limit_reached_email(company, :member_count, 19)
      assert length(all_enqueued(worker: LimitBreachAlertEmailWorker)) == 2
    end)
  end

  test "does not enqueue limit-reached emails when global billing is enabled but company limits are off", ctx do
    enable_global_billing()
    fill_company_to_member_count(ctx.company, 20)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert :ok = LimitBreachAlerting.maybe_enqueue_limit_reached_email(ctx.company, :member_count, 19)
      refute_enqueued worker: LimitBreachAlertEmailWorker
    end)
  end

  defp enable_billing(company) do
    enable_global_billing()

    {:ok, company} = Operately.Companies.enable_experimental_feature(company, "billing")
    company
  end

  defp enable_global_billing do
    previous_value = Application.get_env(:operately, :billing_enabled)
    Application.put_env(:operately, :billing_enabled, true)

    on_exit(fn ->
      restore_billing_enabled(previous_value)
    end)
  end

  defp restore_billing_enabled(nil), do: Application.delete_env(:operately, :billing_enabled)
  defp restore_billing_enabled(value), do: Application.put_env(:operately, :billing_enabled, value)

  defp fill_company_to_member_count(company, target_count) do
    current_count = Billing.active_member_count(company)

    if current_count < target_count do
      Enum.each((current_count + 1)..target_count, fn index ->
        account = account_fixture(%{email: "limit-alert-member-#{index}@example.com", full_name: "Limit Alert Member #{index}"})

        %Person{}
        |> Person.changeset(%{
          company_id: company.id,
          account_id: account.id,
          full_name: "Limit Alert Member #{index}",
          email: account.email,
          suspended: false
        })
        |> Repo.insert!()
      end)
    end
  end
end
