defmodule Operately.Billing.NearLimitAlertEmailWorkerTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Swoosh.TestAssertions

  alias Operately.Access
  alias Operately.Billing.NearLimitAlertEmailWorker
  alias Operately.Billing.NearLimitAlerting

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id, full_name: "Admin Adminson"})
    owner = person_fixture_with_account(%{company_id: company.id, full_name: "Owner Ownerson"})

    context = Access.get_context!(company_id: company.id)
    owner_group = Access.get_group!(company_id: company.id, tag: :full_access)

    Access.bind(context, person_id: admin.id, level: Access.Binding.admin_access())
    Access.bind(context, person_id: owner.id, level: Access.Binding.full_access())
    {:ok, _membership} = Access.add_to_group(owner_group, person_id: admin.id)

    {:ok, company: company, admin: admin, owner: owner}
  end

  test "delivers one deduplicated email to admins and owners for member limits", ctx do
    assert :ok =
             perform_job(NearLimitAlertEmailWorker, %{
               company_id: ctx.company.id,
               limit_key: "member_count",
               current_usage: 18,
               limit: 20
             })

    expected_recipients =
      ctx.company
      |> NearLimitAlerting.recipients()
      |> Enum.map(& &1.email)
      |> Enum.sort()

    assert_email_sent(fn email ->
      assert email.subject == "#{ctx.company.name} is near its Free plan member limit"
      assert Enum.sort(Enum.map(email.to, &elem(&1, 1))) == expected_recipients
      assert email.html_body =~ "#{ctx.company.name} has 18 of 20 active members on the Free plan."
      assert email.html_body =~ "Adding or restoring people will be blocked once the member limit is reached."
      assert email.html_body =~ "Review billing"
      assert email.text_body =~ OperatelyWeb.Paths.company_billing_path(ctx.company)
      true
    end)
  end

  test "delivers a storage-limit near-limit email", ctx do
    assert :ok =
             perform_job(NearLimitAlertEmailWorker, %{
               company_id: ctx.company.id,
               limit_key: "storage_bytes",
               current_usage: 966_367_642,
               limit: 1_073_741_824
             })

    assert_email_sent(fn email ->
      assert email.subject == "#{ctx.company.name} is near its Free plan storage limit"
      assert email.html_body =~ "#{ctx.company.name} is using 921.6 MB of 1.0 GB on the Free plan."
      assert email.html_body =~ "Uploading files will be blocked once the storage limit is reached."
      assert email.text_body =~ OperatelyWeb.Paths.company_billing_path(ctx.company)
      true
    end)
  end

  test "discards jobs for missing companies" do
    assert {:discard, "company_not_found"} =
             perform_job(NearLimitAlertEmailWorker, %{
               company_id: Ecto.UUID.generate(),
               limit_key: "member_count",
               current_usage: 18,
               limit: 20
             })

    refute_email_sent()
  end

  test "discards jobs for invalid limit keys", ctx do
    assert {:discard, "invalid_job_args"} =
             perform_job(NearLimitAlertEmailWorker, %{
               company_id: ctx.company.id,
               limit_key: "unknown_limit",
               current_usage: 18,
               limit: 20
             })

    refute_email_sent()
  end
end
