defmodule Operately.Billing.LimitBreachAlertEmailWorkerTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Swoosh.TestAssertions

  alias Operately.Access
  alias Operately.Billing
  alias Operately.Billing.LimitBreachAlertEmailWorker
  alias Operately.Billing.LimitBreachAlerting

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id, full_name: "Admin Adminson"})
    owner = person_fixture_with_account(%{company_id: company.id, full_name: "Owner Ownerson"})

    context = Access.get_context!(company_id: company.id)
    owner_group = Access.get_group!(company_id: company.id, tag: :full_access)

    Access.bind(context, person_id: admin.id, level: Access.Binding.admin_access())
    Access.bind(context, person_id: owner.id, level: Access.Binding.full_access())
    {:ok, _membership} = Access.add_to_group(owner_group, person_id: admin.id)

    {:ok, company: enable_billing(company), admin: admin, owner: owner}
  end

  test "delivers one deduplicated email to admins and owners", ctx do
    fill_company_to_member_count(ctx.company, 20)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert :ok = LimitBreachAlerting.maybe_enqueue_limit_reached_email(ctx.company, :member_count, 19)

      [job] = all_enqueued(worker: LimitBreachAlertEmailWorker)
      assert :ok = perform_job(LimitBreachAlertEmailWorker, job.args)

      expected_subject = "#{ctx.company.name} has reached its member limit"
      expected_recipients =
        ctx.company
        |> LimitBreachAlerting.recipients()
        |> Enum.map(& &1.email)
        |> Enum.sort()

      assert_received {:email, %Swoosh.Email{subject: ^expected_subject} = email}
      assert Enum.sort(Enum.map(email.to, &elem(&1, 1))) == expected_recipients
      assert email.html_body =~ ctx.company.name
      assert email.html_body =~ "20"
      assert email.html_body =~ "Review Billing"
      assert email.text_body =~ OperatelyWeb.Paths.company_billing_path(ctx.company)
    end)
  end

  test "discards jobs for missing companies" do
    assert {:discard, "company_not_found"} =
             perform_job(LimitBreachAlertEmailWorker, %{
               company_id: Ecto.UUID.generate(),
               limit_key: "member_count",
               current_usage: 20,
               limit: 20
             })

    refute_email_sent()
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
        person_fixture_with_account(%{
          company_id: company.id,
          full_name: "Worker Limit Member #{index}",
          email: "worker-limit-member-#{index}@example.com"
        })
      end)
    end
  end
end
